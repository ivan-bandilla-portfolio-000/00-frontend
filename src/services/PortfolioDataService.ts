import type { lf } from '@/clientDB/schema';
import type { Project } from '@/clientDB/@types/Project';
import type { ExperienceRow } from '@/services/ExperienceService';
import type { ContactInfo } from '@/services/ContactInfoService';

import { ProjectService } from '@/services/ProjectService';
import { ExperienceService } from '@/services/ExperienceService';
import { ContactInfoService } from '@/services/ContactInfoService';

export type PortfolioData = {
    projects: Project[];
    experiences: ExperienceRow[];
    contactInfo: ContactInfo | null;
};

export class PortfolioDataService {
    private static inFlight: Promise<PortfolioData> | null = null;
    private static ensureInFlight: Promise<PortfolioData> | null = null;

    // Force refresh from API for all domains, then return everything from DB
    static async refreshAndGetAll(db: lf.Database): Promise<PortfolioData> {
        if (!this.inFlight) {
            this.inFlight = (async () => {
                // Fetch from APIs in parallel, then save
                await Promise.all([
                    ProjectService.fetchProjects(db), // fetches + saves tags/statuses/categories/projects + associations
                    (async () => {
                        const items = await ExperienceService.fetchExperiencesFromApi();
                        await ExperienceService.saveExperiences(db, items);
                    })(),
                    ContactInfoService.fetchAndSave(db),
                ]);

                // Read back from DB in parallel
                const [projects, experiences, contactInfo] = await Promise.all([
                    ProjectService.getProjects(db),
                    ExperienceService.getExperiences(db),
                    ContactInfoService.getContactInfo(db),
                ]);

                return { projects, experiences, contactInfo };
            })();

            // Reset the in-flight marker when done (success or failure)
            this.inFlight.finally(() => { this.inFlight = null; });
        }
        return this.inFlight;
    }

    // Ensure DB has data (only fetches missing domains), then return everything
    static async ensureAndGetAll(db: lf.Database): Promise<PortfolioData> {
        if (!this.ensureInFlight) {
            this.ensureInFlight = (async () => {
                const [projects, experiences, contactInfo] = await Promise.all([
                    ProjectService.ensureAndGetProjects(db),
                    ExperienceService.ensureAndGetExperiences(db),
                    ContactInfoService.ensureAndGet(db),
                ]);
                return { projects, experiences, contactInfo };
            })();

            this.ensureInFlight.finally(() => { this.ensureInFlight = null; });
        }
        return this.ensureInFlight;
    }

    // Just read everything currently in DB (no network)
    static async getAllFromDB(db: lf.Database): Promise<PortfolioData> {
        const [projects, experiences, contactInfo] = await Promise.all([
            ProjectService.getProjects(db),
            ExperienceService.getExperiences(db),
            ContactInfoService.getContactInfo(db),
        ]);
        return { projects, experiences, contactInfo };
    }
}
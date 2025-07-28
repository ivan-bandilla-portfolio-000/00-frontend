type Model = {
    model: string;
    model_id: string;
}

export const defaultModel: Model = {
    model: "Llama 3.2 1B Instruct q4f32_1 MLC",
    model_id: "Llama-3.2-1B-Instruct-q4f32_1-MLC"
}

export const choosePortfolioContextInstruction = `
Generate a single, direct question that meets all of the following criteria:

1. Can be answered with “yes” or “no” (but do not include those words in the question).

2. Identifies whether the respondent is either:
    - an IT developer or IT professional (e.g. software engineer, backend developer), or
    - a non-technical professional working in IT-adjacent fields (e.g. HR, recruiter).

3. A “yes” answer should suggest the respondent has a technical IT role.

4. A “no” answer should suggest the respondent is in a non-technical, IT-adjacent role.

5. Uses simple and precise language suitable for non-native English speakers.

6. Maintains a polite and friendly tone.

7. Does not ask for additional information or background.

8. Avoids vague terms like “digital tools,” “systems,” or “technical field.”

9. Avoids abstract, metaphorical, or ambiguous language.

10. Should be at least 6-10 words

11. Return only the plain question. No formatting. No explanation. No extra content.

Examples (for structure only):
- Do you work in software development?
- Are you an IT professional?
`;
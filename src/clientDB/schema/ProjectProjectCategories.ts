import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('project_project_categories')
    .addColumn('project_id', lf.Type.INTEGER)
    .addColumn('category_id', lf.Type.INTEGER)
    .addPrimaryKey(['project_id', 'category_id']);

(schemaBuilder as any).createIndex?.('idx_ppc_project')?.on('project_project_categories', ['project_id']);
(schemaBuilder as any).createIndex?.('idx_ppc_category')?.on('project_project_categories', ['category_id']);
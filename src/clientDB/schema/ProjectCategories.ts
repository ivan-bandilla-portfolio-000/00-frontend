import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('project_categories')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING)
    .addPrimaryKey(['id'], true);
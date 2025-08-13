import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('project_statuses')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING)
    .addPrimaryKey(['id'], true);
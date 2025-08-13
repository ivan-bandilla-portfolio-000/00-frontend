import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('tech_stack')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('content', lf.Type.STRING)
    .addColumn('icon', lf.Type.STRING)
    .addPrimaryKey(['id'], true);
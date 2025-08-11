import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('projects')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING)
    .addColumn('description', lf.Type.STRING).addNullable(['description'])
    .addColumn('image', lf.Type.STRING).addNullable(['image'])
    .addColumn('avp', lf.Type.STRING).addNullable(['avp'])
    .addColumn('source_code_link', lf.Type.STRING).addNullable(['source_code_link'])
    .addPrimaryKey(['id'], true);
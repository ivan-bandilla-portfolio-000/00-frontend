import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('experiences')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('company', lf.Type.STRING)
    .addColumn('role_id', lf.Type.INTEGER).addNullable(['role_id'])
    .addColumn('position', lf.Type.STRING)
    .addColumn('start', lf.Type.DATE_TIME)
    .addColumn('end', lf.Type.DATE_TIME)
    .addColumn('description', lf.Type.STRING).addNullable(['description'])
    .addColumn('type', lf.Type.STRING)
    .addColumn('hidden', lf.Type.BOOLEAN)
    .addPrimaryKey(['id'], true);
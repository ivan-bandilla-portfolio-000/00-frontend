import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('projects')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING)
    .addColumn('role_id', lf.Type.INTEGER).addNullable(['role_id'])
    .addColumn('description', lf.Type.STRING).addNullable(['description'])
    .addColumn('image', lf.Type.STRING).addNullable(['image'])
    .addColumn('avp', lf.Type.STRING).addNullable(['avp'])
    .addColumn('project_link', lf.Type.STRING).addNullable(['project_link'])
    .addColumn('status_id', lf.Type.INTEGER).addNullable(['status_id'])
    .addColumn('start_date', lf.Type.STRING)
    .addColumn('end_date', lf.Type.STRING).addNullable(['end_date'])
    .addPrimaryKey(['id'], true);
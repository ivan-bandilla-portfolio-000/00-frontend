import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('roles')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING)
    .addPrimaryKey(['id'], true);
import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('tag_types')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING) // e.g., 'language', 'miscellaneous'
    .addPrimaryKey(['id'], true);
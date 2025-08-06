import { schemaBuilder, lf } from '@/clientDB/schema';

schemaBuilder.createTable('TagType')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING) // e.g., 'language', 'miscellaneous'
    .addPrimaryKey(['id'], true);
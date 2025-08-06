import { schemaBuilder, lf } from '@/clientDB/schema';

schemaBuilder.createTable('Projects')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING)
    .addColumn('description', lf.Type.STRING).addNullable(['description'])
    .addColumn('image', lf.Type.STRING).addNullable(['image'])
    .addColumn('avp', lf.Type.STRING).addNullable(['avp'])
    .addColumn('sourceCodeLink', lf.Type.STRING).addNullable(['sourceCodeLink'])
    .addPrimaryKey(['id'], true);
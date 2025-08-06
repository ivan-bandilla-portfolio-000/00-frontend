import { schemaBuilder, lf } from '@/clientDB/schema';

schemaBuilder.createTable('ProjectTags')
    .addColumn('projectId', lf.Type.INTEGER)
    .addColumn('tagId', lf.Type.INTEGER)
    .addPrimaryKey(['projectId', 'tagId']);
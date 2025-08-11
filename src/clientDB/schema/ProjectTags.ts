import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('project_tags')
    .addColumn('project_id', lf.Type.INTEGER)
    .addColumn('tag_id', lf.Type.INTEGER)
    .addPrimaryKey(['project_id', 'tag_id']);
import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('experience_tags')
    .addColumn('experience_id', lf.Type.INTEGER)
    .addColumn('tag_id', lf.Type.INTEGER)
    .addPrimaryKey(['experience_id', 'tag_id']);
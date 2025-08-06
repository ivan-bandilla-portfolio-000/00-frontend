import { schemaBuilder, lf } from '@/clientDB/schema';

schemaBuilder.createTable('Tags')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING)
    .addColumn('color', lf.Type.STRING).addNullable(['color'])
    .addColumn('icon', lf.Type.STRING).addNullable(['icon'])
    .addColumn('typeId', lf.Type.INTEGER).addNullable(['typeId'])
    .addPrimaryKey(['id'], true)
    .addUnique('uq_tag_name', ['name'])
    .addForeignKey('fk_tag_type', {
        local: 'typeId',
        ref: 'TagType.id',
        action: lf.ConstraintAction.RESTRICT
    });
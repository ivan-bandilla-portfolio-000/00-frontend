import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('tags')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('name', lf.Type.STRING)
    .addColumn('color', lf.Type.STRING).addNullable(['color'])
    .addColumn('icon', lf.Type.STRING).addNullable(['icon'])
    .addColumn('type_id', lf.Type.INTEGER).addNullable(['type_id'])
    .addPrimaryKey(['id'], true)
    .addUnique('uq_tag_name', ['name'])
    .addForeignKey('fk_tag_type', {
        local: 'type_id',
        ref: 'tag_types.id',
        action: lf.ConstraintAction.RESTRICT
    });
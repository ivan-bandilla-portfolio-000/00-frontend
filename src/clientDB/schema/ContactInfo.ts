import { schemaBuilder, lf } from './schemaBuilder';

schemaBuilder.createTable('contact_info')
    .addColumn('id', lf.Type.INTEGER)
    .addColumn('first_name', lf.Type.STRING)
    .addColumn('last_name', lf.Type.STRING)
    .addColumn('prefix', lf.Type.STRING).addNullable(['prefix'])
    .addColumn('title', lf.Type.STRING).addNullable(['title'])
    .addColumn('email', lf.Type.STRING).addNullable(['email'])
    .addColumn('phone', lf.Type.STRING).addNullable(['phone'])
    .addColumn('linkedin_username', lf.Type.STRING).addNullable(['linkedin_username'])
    .addColumn('linkedin_url', lf.Type.STRING).addNullable(['linkedin_url'])
    .addColumn('github_username', lf.Type.STRING).addNullable(['github_username'])
    .addColumn('github_url', lf.Type.STRING).addNullable(['github_url'])
    .addPrimaryKey(['id'], true);
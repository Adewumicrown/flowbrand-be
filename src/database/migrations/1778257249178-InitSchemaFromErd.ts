import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchemaFromErd1778257249178 implements MigrationInterface {
    name = 'InitSchemaFromErd1778257249178'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "full_name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password" text, "country" character varying(100), "is_verified" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "avatar_url" text, "auth_provider" character varying(20) NOT NULL, "provider_user_id" text, "otp_code" character varying(6) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_auth_provider_user" ON "users" ("auth_provider", "provider_user_id") `);
        await queryRunner.query(`CREATE TABLE "strategies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "title" character varying(200) NOT NULL DEFAULT 'My Marketing Strategy', "ai_prompt_used" text, "ai_raw_output" text, "request_count" integer NOT NULL DEFAULT '0', "status" character varying(20) NOT NULL DEFAULT 'active', "is_paid" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9a0d363ddf5b40d080147363238" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "funnel_stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "strategy_id" uuid NOT NULL, "stage_order" smallint NOT NULL, "title" character varying(100), "description" text, "is_unlocked" boolean NOT NULL DEFAULT false, "completed_at" TIMESTAMP, CONSTRAINT "PK_4a0c461c532e1acb63ce6c44e32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_funnel_stages_strategy_order" ON "funnel_stages" ("strategy_id", "stage_order") `);
        await queryRunner.query(`CREATE TABLE "weekly_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "strategy_id" uuid NOT NULL, "funnel_stage_id" uuid NOT NULL, "week_number" smallint NOT NULL, "log_text" text NOT NULL, "submitted_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0f62f13bdeb5cb2c9c3ea1c4a9c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_weekly_logs_user_strategy_week" ON "weekly_logs" ("user_id", "strategy_id", "week_number") `);
        await queryRunner.query(`CREATE TABLE "waitlist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2221cffeeb64bff14201bd5b3de" UNIQUE ("email"), CONSTRAINT "PK_973cfbedc6381485681d6a6916c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_roles_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "role" "public"."user_roles_role_enum" NOT NULL DEFAULT 'user', CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "plan" character varying(50) NOT NULL DEFAULT 'free', "status" character varying(30) NOT NULL DEFAULT 'active', "started_at" TIMESTAMP, "expires_at" TIMESTAMP, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "uploaded_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "file_name" character varying(255), "file_size_kb" integer, "file_type" character varying(10), "storage_path" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6bd36c941b6c6187ac74ded1ca8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "token_usage" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "strategy_id" uuid NOT NULL, "token_used" integer, CONSTRAINT "PK_b85b17103d77d9695632654729d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "strategy_documents" ("strategy_id" uuid NOT NULL, "document_id" uuid NOT NULL, CONSTRAINT "PK_9a9a2290c6e827bad2b0a665e41" PRIMARY KEY ("strategy_id", "document_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('stage_unlocked', 'task_reminder', 'weekly_nudge', 'milestone', 'mention', 'system')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."notification_type_enum", "title" character varying(200), "body" text, "is_read" boolean NOT NULL DEFAULT false, "is_resolved" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "admin_id" uuid NOT NULL, "type" character varying(30), "title" character varying(200), "body" text, "related_user_id" uuid, "is_read" boolean NOT NULL DEFAULT false, "is_resolved" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1fecd1cab747b7ab6e850091901" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "general_enabled" boolean NOT NULL DEFAULT true, "push_email_enabled" boolean NOT NULL DEFAULT false, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_64c90edc7310c6be7c10c96f675" UNIQUE ("user_id"), CONSTRAINT "REL_64c90edc7310c6be7c10c96f67" UNIQUE ("user_id"), CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "funnel_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "funnel_stage_id" uuid NOT NULL, "title" character varying(200), "description" text, "task_order" smallint, "is_checked" boolean NOT NULL DEFAULT false, "checked_at" TIMESTAMP, CONSTRAINT "PK_70d3898978bea5c6a33e98eb261" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "refresh_token" text NOT NULL, "expires_at" TIMESTAMP NOT NULL, "is_revoked" boolean NOT NULL DEFAULT false, "revoked_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_69214fd09be67af95c186be26db" UNIQUE ("refresh_token"), CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth_metadata" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "locked_until" TIMESTAMP, "last_login_at" TIMESTAMP, "password_changed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a680635b0979dd385dc7a5044d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."api_health_status_enum" AS ENUM('operational', 'degraded', 'down')`);
        await queryRunner.query(`CREATE TABLE "api_health" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "api_group" character varying NOT NULL, "status" "public"."api_health_status_enum" NOT NULL DEFAULT 'operational', "lastChecked" TIMESTAMP NOT NULL DEFAULT now(), "details" character varying NOT NULL, CONSTRAINT "PK_f14f632e7e94b52a84096e986f8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "request" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "requestName" character varying NOT NULL, "status" character varying, "requestUrl" character varying NOT NULL, "responseTime" integer NOT NULL, "statusCode" integer NOT NULL, "errors" text, "apiHealthId" uuid, CONSTRAINT "PK_167d324701e6867f189aed52e18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "strategies" ADD CONSTRAINT "FK_c3e9760692a90d4f2d482ce60f8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funnel_stages" ADD CONSTRAINT "FK_bce66c188e57132bc155e6b3d7a" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "weekly_logs" ADD CONSTRAINT "FK_b4dc06eede0bc611d500343b8ac" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "weekly_logs" ADD CONSTRAINT "FK_4ebf38df71bf0c00d02251f888f" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "weekly_logs" ADD CONSTRAINT "FK_c48998b4b2015a8f58d145603de" FOREIGN KEY ("funnel_stage_id") REFERENCES "funnel_stages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "uploaded_documents" ADD CONSTRAINT "FK_b5423d1e7ccd9ff75ff3be1cc78" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "token_usage" ADD CONSTRAINT "FK_f3e27270e575ec838d6039f6c5a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "token_usage" ADD CONSTRAINT "FK_b2722408c71db7b997ecb5d26bc" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "strategy_documents" ADD CONSTRAINT "FK_e38aab0d20f1a323911b7379ca4" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "strategy_documents" ADD CONSTRAINT "FK_82ffc490ced56c8a3ba94a7d50b" FOREIGN KEY ("document_id") REFERENCES "uploaded_documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_notifications" ADD CONSTRAINT "FK_c07cffb34f4e05a78f7663bc611" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_notifications" ADD CONSTRAINT "FK_47a62b5af42133558852323f1a2" FOREIGN KEY ("related_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_64c90edc7310c6be7c10c96f675" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funnel_tasks" ADD CONSTRAINT "FK_c23717cb7c7982dc0928d23d2a7" FOREIGN KEY ("funnel_stage_id") REFERENCES "funnel_stages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_metadata" ADD CONSTRAINT "FK_ddd81470f2c5703341629008c83" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request" ADD CONSTRAINT "FK_5577700a906a17e52a2418db550" FOREIGN KEY ("apiHealthId") REFERENCES "api_health"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request" DROP CONSTRAINT "FK_5577700a906a17e52a2418db550"`);
        await queryRunner.query(`ALTER TABLE "auth_metadata" DROP CONSTRAINT "FK_ddd81470f2c5703341629008c83"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`);
        await queryRunner.query(`ALTER TABLE "funnel_tasks" DROP CONSTRAINT "FK_c23717cb7c7982dc0928d23d2a7"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_64c90edc7310c6be7c10c96f675"`);
        await queryRunner.query(`ALTER TABLE "admin_notifications" DROP CONSTRAINT "FK_47a62b5af42133558852323f1a2"`);
        await queryRunner.query(`ALTER TABLE "admin_notifications" DROP CONSTRAINT "FK_c07cffb34f4e05a78f7663bc611"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "strategy_documents" DROP CONSTRAINT "FK_82ffc490ced56c8a3ba94a7d50b"`);
        await queryRunner.query(`ALTER TABLE "strategy_documents" DROP CONSTRAINT "FK_e38aab0d20f1a323911b7379ca4"`);
        await queryRunner.query(`ALTER TABLE "token_usage" DROP CONSTRAINT "FK_b2722408c71db7b997ecb5d26bc"`);
        await queryRunner.query(`ALTER TABLE "token_usage" DROP CONSTRAINT "FK_f3e27270e575ec838d6039f6c5a"`);
        await queryRunner.query(`ALTER TABLE "uploaded_documents" DROP CONSTRAINT "FK_b5423d1e7ccd9ff75ff3be1cc78"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "weekly_logs" DROP CONSTRAINT "FK_c48998b4b2015a8f58d145603de"`);
        await queryRunner.query(`ALTER TABLE "weekly_logs" DROP CONSTRAINT "FK_4ebf38df71bf0c00d02251f888f"`);
        await queryRunner.query(`ALTER TABLE "weekly_logs" DROP CONSTRAINT "FK_b4dc06eede0bc611d500343b8ac"`);
        await queryRunner.query(`ALTER TABLE "funnel_stages" DROP CONSTRAINT "FK_bce66c188e57132bc155e6b3d7a"`);
        await queryRunner.query(`ALTER TABLE "strategies" DROP CONSTRAINT "FK_c3e9760692a90d4f2d482ce60f8"`);
        await queryRunner.query(`DROP TABLE "request"`);
        await queryRunner.query(`DROP TABLE "api_health"`);
        await queryRunner.query(`DROP TYPE "public"."api_health_status_enum"`);
        await queryRunner.query(`DROP TABLE "auth_metadata"`);
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`DROP TABLE "funnel_tasks"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP TABLE "admin_notifications"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`DROP TABLE "strategy_documents"`);
        await queryRunner.query(`DROP TABLE "token_usage"`);
        await queryRunner.query(`DROP TABLE "uploaded_documents"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TYPE "public"."user_roles_role_enum"`);
        await queryRunner.query(`DROP TABLE "waitlist"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_weekly_logs_user_strategy_week"`);
        await queryRunner.query(`DROP TABLE "weekly_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_funnel_stages_strategy_order"`);
        await queryRunner.query(`DROP TABLE "funnel_stages"`);
        await queryRunner.query(`DROP TABLE "strategies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_auth_provider_user"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}

# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_08_10_215423) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "clerk_org_maps", id: false, force: :cascade do |t|
    t.text "clerk_org_id", null: false
    t.uuid "org_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["clerk_org_id"], name: "index_clerk_org_maps_on_clerk_org_id", unique: true
    t.index ["org_id"], name: "index_clerk_org_maps_on_org_id"
  end

  create_table "orgs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "owner_user_id"
    t.index ["owner_user_id"], name: "index_orgs_on_owner_user_id", unique: true
  end

  create_table "payments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "org_id", null: false
    t.uuid "tenant_id", null: false
    t.date "due_date", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.string "status", default: "due", null: false
    t.datetime "paid_at"
    t.string "method"
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["org_id"], name: "index_payments_on_org_id"
    t.index ["tenant_id", "due_date"], name: "idx_payments_unique_tenant_month", unique: true
    t.index ["tenant_id"], name: "index_payments_on_tenant_id"
  end

  create_table "tenants", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "org_id", null: false
    t.string "full_name", null: false
    t.string "phone"
    t.string "email"
    t.date "lease_start"
    t.date "lease_end"
    t.uuid "unit_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "rent_amount", precision: 10, scale: 2
    t.index ["org_id"], name: "index_tenants_on_org_id"
    t.index ["unit_id"], name: "index_tenants_on_unit_id"
  end

  create_table "units", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "org_id", null: false
    t.string "name", null: false
    t.string "address"
    t.decimal "monthly_rent", precision: 10, scale: 2
    t.text "notes"
    t.string "cover_image_uri"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["org_id"], name: "index_units_on_org_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "org_id", null: false
    t.string "email", null: false
    t.string "role", default: "member", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["org_id"], name: "index_users_on_org_id"
  end

  add_foreign_key "clerk_org_maps", "orgs"
  add_foreign_key "payments", "orgs"
  add_foreign_key "payments", "tenants"
  add_foreign_key "tenants", "orgs"
  add_foreign_key "tenants", "units"
  add_foreign_key "units", "orgs"
  add_foreign_key "users", "orgs"
end

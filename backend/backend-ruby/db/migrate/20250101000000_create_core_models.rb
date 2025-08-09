class CreateCoreModels < ActiveRecord::Migration[8.0]
  def change
    create_table :orgs, id: :uuid do |t|
      t.string :name, null: false
      t.timestamps
    end

    create_table :users, id: :uuid do |t|
      t.references :org, null: false, foreign_key: true, type: :uuid
      t.string :email, null: false
      t.string :role, null: false, default: "member"
      t.timestamps
    end
    add_index :users, :org_id, if_not_exists: true

    create_table :units, id: :uuid do |t|
      t.references :org, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.string :address
      t.decimal :monthly_rent, precision: 10, scale: 2
      t.text :notes
      t.string :cover_image_uri
      t.timestamps
    end
    add_index :units, :org_id, if_not_exists: true

    create_table :tenants, id: :uuid do |t|
      t.references :org, null: false, foreign_key: true, type: :uuid
      t.string :full_name, null: false
      t.string :phone
      t.string :email
      t.date :lease_start
      t.date :lease_end
      t.references :unit, foreign_key: true, type: :uuid
      t.timestamps
    end
    add_index :tenants, :org_id, if_not_exists: true
    add_index :tenants, :unit_id, if_not_exists: true

    create_table :payments, id: :uuid do |t|
      t.references :org, null: false, foreign_key: true, type: :uuid
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.date :due_date, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: "due"
      t.datetime :paid_at
      t.string :method
      t.text :note
      t.timestamps
    end
    add_index :payments, :org_id, if_not_exists: true
    add_index :payments, :tenant_id, if_not_exists: true
  end
end



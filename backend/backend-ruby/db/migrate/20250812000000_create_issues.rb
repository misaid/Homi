class CreateIssues < ActiveRecord::Migration[8.0]
  def change
    create_table :issues, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :org_id, null: false
      t.uuid :unit_id
      t.uuid :tenant_id
      t.string :title, null: false
      t.text :description
      t.string :severity, null: false, default: "low"
      t.string :status, null: false, default: "open"
      t.timestamps
    end

    add_index :issues, [:org_id, :severity]
    add_index :issues, [:org_id, :status]
    add_index :issues, [:org_id, :created_at]

    add_foreign_key :issues, :orgs
    add_foreign_key :issues, :units
    add_foreign_key :issues, :tenants
  end
end



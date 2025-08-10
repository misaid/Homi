class CreateClerkOrgMaps < ActiveRecord::Migration[8.0]
  def change
    create_table :clerk_org_maps, id: false do |t|
      t.text :clerk_org_id, null: false
      t.uuid :org_id, null: false
      t.timestamps
    end

    add_index :clerk_org_maps, :clerk_org_id, unique: true
    add_index :clerk_org_maps, :org_id
    add_foreign_key :clerk_org_maps, :orgs, column: :org_id
  end
end



class AddOwnerUserIdToOrgs < ActiveRecord::Migration[8.0]
  def change
    add_column :orgs, :owner_user_id, :text, null: true
    add_index :orgs, :owner_user_id, unique: true
  end
end



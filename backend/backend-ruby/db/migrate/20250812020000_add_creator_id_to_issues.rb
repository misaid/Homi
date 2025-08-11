class AddCreatorIdToIssues < ActiveRecord::Migration[8.0]
  def change
    add_column :issues, :creator_id, :uuid, null: true
    add_index :issues, :creator_id
    add_foreign_key :issues, :users, column: :creator_id
  end
end



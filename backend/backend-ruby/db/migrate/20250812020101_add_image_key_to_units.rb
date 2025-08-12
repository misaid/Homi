class AddImageKeyToUnits < ActiveRecord::Migration[8.0]
  def change
    add_column :units, :image_key, :text, null: true
  end
end



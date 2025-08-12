class AddImageUrlToUnits < ActiveRecord::Migration[8.0]
  def change
    add_column :units, :image_url, :text, null: true
  end
end



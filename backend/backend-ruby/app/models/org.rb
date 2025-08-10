class Org < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :units, dependent: :destroy
  has_many :tenants, dependent: :destroy
  has_many :payments, dependent: :destroy
  has_many :clerk_org_maps, dependent: :destroy

  validates :name, presence: true
end



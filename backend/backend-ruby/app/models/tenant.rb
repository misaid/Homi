class Tenant < ApplicationRecord
  belongs_to :org
  belongs_to :unit, optional: true
  has_many :payments

  validates :full_name, presence: true
end



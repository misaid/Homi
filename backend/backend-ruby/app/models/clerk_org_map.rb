class ClerkOrgMap < ApplicationRecord
  self.primary_key = :clerk_org_id

  belongs_to :org

  validates :clerk_org_id, presence: true
  validates :org_id, presence: true
end



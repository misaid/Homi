class DeviceToken < ApplicationRecord
  belongs_to :org
  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :platform, presence: true, inclusion: { in: %w[ios android] }
end



class Notification < ApplicationRecord
  belongs_to :org
  belongs_to :user

  validates :title, presence: true
  validates :body, presence: true

  scope :unread, -> { where(read_at: nil) }
end



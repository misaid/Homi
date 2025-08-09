class User < ApplicationRecord
  belongs_to :org

  enum :role, {
    admin: "admin",
    manager: "manager",
    member: "member"
  }, validate: false

  validates :email, presence: true
end



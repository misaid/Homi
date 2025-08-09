FactoryBot.define do
  factory :payment do
    association :org
    association :tenant
    due_date { Date.today + 7.days }
    amount { 1200.0 }
    status { "due" }
    add_attribute(:method) { "cash" }
  end
end



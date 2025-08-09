FactoryBot.define do
  factory :user do
    association :org
    email { Faker::Internet.email }
    role { %w[admin manager member].sample }
  end
end



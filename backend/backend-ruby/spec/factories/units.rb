FactoryBot.define do
  factory :unit do
    association :org
    name { "Unit #{Faker::Alphanumeric.alpha(number: 3).upcase}" }
    address { Faker::Address.full_address }
    monthly_rent { Faker::Number.decimal(l_digits: 3, r_digits: 2) }
  end
end



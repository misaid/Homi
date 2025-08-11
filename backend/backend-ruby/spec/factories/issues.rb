FactoryBot.define do
  factory :issue do
    association :org
    title { "Sample issue" }
    description { "A sample maintenance issue" }
    severity { "low" }
    status { "open" }
    unit { nil }
    tenant { nil }
  end
end



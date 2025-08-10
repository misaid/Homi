class OrgResolver
  # Returns the UUID of the resolved or newly created Org as a string
  def self.resolve_and_ensure!(clerk_org_id:, fallback_name: nil)
    new.resolve_and_ensure!(clerk_org_id: clerk_org_id, fallback_name: fallback_name)
  end

  def resolve_and_ensure!(clerk_org_id:, fallback_name: nil)
    if clerk_org_id.present?
      # Try fast path first
      if (mapping = ClerkOrgMap.find_by(clerk_org_id: clerk_org_id))
        return mapping.org_id
      end

      # Create org and mapping atomically; handle races with find_or_create_by
      org_name = fallback_name.presence || "New Org"
      org = nil
      ActiveRecord::Base.transaction do
        org = Org.create!(name: org_name)
        begin
          ClerkOrgMap.create!(clerk_org_id: clerk_org_id, org_id: org.id)
        rescue ActiveRecord::RecordNotUnique, ActiveRecord::StatementInvalid
          # Another request might have created the mapping; fetch it
          mapping = ClerkOrgMap.find_by!(clerk_org_id: clerk_org_id)
          org = mapping.org
        end
      end
      return org.id
    else
      org_name = fallback_name.presence || "Personal Org"
      org = Org.create!(name: org_name)
      return org.id
    end
  end
end



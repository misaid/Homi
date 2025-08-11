module V1
  class IssuesController < ApplicationController
    before_action :require_organization!
    before_action :set_issue, only: %i[show update destroy]

    # GET /api/v1/issues
    def index
      base_scope = Issue.where(org_id: current_org_id).includes(:unit, :tenant)
      base_scope = base_scope.where(severity: params[:severity]) if params[:severity].present?
      base_scope = base_scope.where(status: params[:status]) if params[:status].present?

      sort_param = params[:sort].presence || "created_at"
      order_param = params[:order].to_s.downcase == "asc" ? "asc" : "desc"
      sort_map = {
        "created_at" => "created_at",
        "severity" => "severity",
        "status" => "status",
        "title" => "title"
      }
      sort_column = sort_map[sort_param] || "created_at"
      base_scope = base_scope.order(Arel.sql("#{sort_column} #{order_param}"))

      pagy_obj, records = pagy(base_scope, page: params[:page], items: params[:limit])
      meta = pagy_metadata(pagy_obj)
      items = records.map { |i| issue_payload(i) }
      render json: {
        items: items,
        page: meta[:page],
        limit: meta[:items],
        total: meta[:count],
        hasMore: meta[:page] < meta[:pages]
      }
    end

    def show
      render json: issue_payload(@issue)
    end

    def create
      attrs = issue_params.merge(org_id: current_org_id, creator_id: current_user_id)
      validation_error = validate_assignment(attrs[:unit_id], attrs[:tenant_id])
      return render json: validation_error, status: :unprocessable_entity if validation_error

      issue = Issue.new(attrs)
      if issue.save
        render json: issue_payload(issue), status: :created
      else
        render json: { errors: issue.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      attrs = issue_params
      validation_error = validate_assignment(attrs[:unit_id], attrs[:tenant_id])
      return render json: validation_error, status: :unprocessable_entity if validation_error

      if @issue.update(attrs)
        render json: issue_payload(@issue)
      else
        render json: { errors: @issue.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @issue.destroy
      head :no_content
    end

    private

    def set_issue
      @issue = Issue.where(org_id: current_org_id).find(params[:id])
    end

    def issue_params
      permitted = [:title, :description, :severity, :status, :unit_id, :tenant_id]
      if params[:issue].is_a?(ActionController::Parameters)
        params.require(:issue).permit(*permitted)
      else
        params.permit(*permitted)
      end
    end

    def validate_assignment(unit_id, tenant_id)
      unit_id = unit_id.presence
      tenant_id = tenant_id.presence
      if unit_id.present?
        unless Unit.where(org_id: current_org_id, id: unit_id).exists?
          return { error: "invalid_assignment", details: "unit not in org" }
        end
      end
      if tenant_id.present?
        tenant = Tenant.where(org_id: current_org_id, id: tenant_id).first
        return { error: "invalid_assignment", details: "tenant not in org" } unless tenant
        if unit_id.present? && tenant.unit_id.present? && tenant.unit_id != unit_id
          return { error: "tenant_unit_mismatch" }
        end
      end
      nil
    end

    def issue_payload(issue)
      issue.as_json(only: [:id, :title, :description, :severity, :status, :unit_id, :tenant_id, :created_at, :updated_at]).merge(
        unit: issue.unit.present? ? { id: issue.unit.id, name: issue.unit.name } : nil,
        tenant: issue.tenant.present? ? { id: issue.tenant.id, full_name: issue.tenant.full_name } : nil
      )
    end
  end
end



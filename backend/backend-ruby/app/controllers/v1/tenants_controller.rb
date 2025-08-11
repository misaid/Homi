module V1
  class TenantsController < ApplicationController
    before_action :require_organization!
    before_action :set_tenant, only: %i[show update destroy]

    def index
      base_scope = Tenant.where(org_id: current_org_id)

      # Search
      q = params[:q].to_s.strip
      if q.present?
        like = "%#{q}%"
        base_scope = base_scope.where(
          "full_name ILIKE :q OR email ILIKE :q OR phone ILIKE :q",
          q: like
        )
      end

      # Sort
      sort_param = params[:sort].presence || "name"
      order_param = params[:order].to_s.downcase == "desc" ? "desc" : "asc"
      sort_map = {
        "name" => "full_name",
        "lease_start" => "lease_start",
        "lease_end" => "lease_end",
        "created_at" => "created_at"
      }
      sort_column = sort_map[sort_param] || "full_name"
      base_scope = base_scope.order(Arel.sql("#{sort_column} #{order_param}"))

      pagy_obj, records = pagy(base_scope, page: params[:page], items: params[:limit])
      meta = pagy_metadata(pagy_obj)
      render json: {
        items: records,
        page: meta[:page],
        limit: meta[:items],
        total: meta[:count],
        hasMore: meta[:page] < meta[:pages]
      }
    end

    def show
      render json: @tenant
    end

    def create
      tenant = Tenant.new(tenant_params.merge(org_id: current_org_id))
      if tenant.save
        render json: tenant, status: :created
      else
        render json: { errors: tenant.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @tenant.update(tenant_params)
        render json: @tenant
      else
        render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @tenant.destroy
      head :no_content
    end

    private

    def set_tenant
      @tenant = Tenant.where(org_id: current_org_id).find(params[:id])
    end

    def tenant_params
      permitted = [:full_name, :phone, :email, :lease_start, :lease_end, :unit_id, :rent_amount]
      if params[:tenant].is_a?(ActionController::Parameters)
        params.require(:tenant).permit(*permitted)
      else
        params.permit(*permitted)
      end
    end
  end
end



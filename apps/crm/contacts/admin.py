from django.contrib import admin

from .models import Activity, Company, Contact


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "industry", "city", "size")
    list_filter = ("industry", "size")
    search_fields = ("name", "city")


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "email", "company", "owner", "created_at")
    list_select_related = ("company", "owner")
    list_filter = ("owner",)
    search_fields = ("last_name", "first_name", "email")
    raw_id_fields = ("company",)
    show_full_result_count = False


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("subject", "kind", "contact", "user", "happened_at")
    list_select_related = ("contact", "user")
    list_filter = ("kind", "user")
    search_fields = ("subject",)
    raw_id_fields = ("contact",)
    show_full_result_count = False

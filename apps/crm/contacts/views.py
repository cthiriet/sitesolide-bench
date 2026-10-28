import csv

from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import connection
from django.db.models import Count, Q
from django.http import HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from .forms import ActivityForm, ContactForm
from .models import Activity, Company, Contact

PAGE_SIZE = 50


def health(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return HttpResponse("ok", content_type="text/plain")


def home(request):
    """Public landing page: no query, so it answers 200 for a deploy check without a session."""
    return render(request, "contacts/home.html")


def parse_id(value):
    """Return an int primary key from a query-string value, or None when it is not one."""
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number if 0 < number < 2**62 else None


@login_required
def dashboard(request):
    kinds = dict(Activity.objects.values_list("kind").annotate(n=Count("id")).order_by())
    context = {
        "contact_count": Contact.objects.count(),
        "company_count": Company.objects.count(),
        "activity_count": sum(kinds.values()),
        "kinds": [(label, kinds.get(value, 0)) for value, label in Activity.KIND_CHOICES],
        "latest": Activity.objects.select_related("contact", "user").order_by("-happened_at", "-id")[:30],
    }
    return render(request, "contacts/dashboard.html", context)


@login_required
def contact_list(request):
    contacts = Contact.objects.select_related("company", "owner")

    company = None
    company_id = parse_id(request.GET.get("company"))
    if company_id:
        contacts = contacts.filter(company_id=company_id)
        company = Company.objects.filter(pk=company_id).first()

    owner_id = parse_id(request.GET.get("owner"))
    if owner_id:
        contacts = contacts.filter(owner_id=owner_id)

    q = request.GET.get("q", "").strip()[:100]
    for term in q.split():
        contacts = contacts.filter(
            Q(first_name__icontains=term) | Q(last_name__icontains=term) | Q(email__icontains=term)
        )

    page = Paginator(contacts.order_by("last_name", "first_name", "id"), PAGE_SIZE).get_page(
        request.GET.get("page")
    )
    query = request.GET.copy()
    query.pop("page", None)
    context = {
        "page": page,
        "company": company,
        "owners": get_user_model().objects.order_by("username").values_list("id", "username"),
        "owner_id": owner_id,
        "q": q,
        "company_id": company_id,
        "querystring": query.urlencode(),
    }
    return render(request, "contacts/contact_list.html", context)


@login_required
def contact_detail(request, pk):
    contact = get_object_or_404(Contact.objects.select_related("company", "owner"), pk=pk)
    activities = contact.activities.select_related("user")
    return render(
        request,
        "contacts/contact_detail.html",
        {"contact": contact, "activities": activities, "form": ActivityForm()},
    )


@login_required
@require_http_methods(["GET", "POST"])
def contact_edit(request, pk=None):
    contact = get_object_or_404(Contact, pk=pk) if pk else None
    initial = {} if contact else {"owner": request.user.pk}
    form = ContactForm(request.POST or None, instance=contact, initial=initial)
    if request.method == "POST" and form.is_valid():
        saved = form.save()
        messages.success(request, "Contact saved.")
        return redirect(saved)
    return render(request, "contacts/contact_form.html", {"form": form, "contact": contact})


@login_required
@require_http_methods(["GET", "POST"])
def activity_new(request, pk):
    contact = get_object_or_404(Contact.objects.select_related("company"), pk=pk)
    form = ActivityForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        activity = form.save(commit=False)
        activity.contact = contact
        activity.user = request.user
        activity.happened_at = timezone.now()
        activity.save()
        messages.success(request, "Activity added.")
        return redirect(contact)
    return render(request, "contacts/activity_form.html", {"form": form, "contact": contact})


@login_required
def company_list(request):
    companies = Company.objects.annotate(contact_count=Count("contacts")).order_by("name", "id")
    industry = request.GET.get("industry", "").strip()[:80]
    if industry:
        companies = companies.filter(industry=industry)
    q = request.GET.get("q", "").strip()[:100]
    if q:
        companies = companies.filter(name__icontains=q)
    page = Paginator(companies, PAGE_SIZE).get_page(request.GET.get("page"))
    query = request.GET.copy()
    query.pop("page", None)
    industries = Company.objects.order_by().values_list("industry", flat=True).distinct()
    context = {
        "page": page,
        "q": q,
        "industry": industry,
        "industries": sorted(industries),
        "querystring": query.urlencode(),
    }
    return render(request, "contacts/company_list.html", context)


@login_required
def company_detail(request, pk):
    company = get_object_or_404(Company, pk=pk)
    contacts = company.contacts.select_related("owner").order_by("last_name", "first_name", "id")[:200]
    return render(request, "contacts/company_detail.html", {"company": company, "contacts": contacts})


class Echo:
    """A file-like object whose write() hands the value back, for csv.writer to stream."""

    def write(self, value):
        return value


EXPORT_HEADER = ["id", "first_name", "last_name", "email", "phone", "title", "company", "owner", "created_at"]


def export_rows():
    writer = csv.writer(Echo())
    yield writer.writerow(EXPORT_HEADER)
    contacts = Contact.objects.select_related("company", "owner").order_by("id")
    for contact in contacts.iterator(chunk_size=2000):
        yield writer.writerow(
            [
                contact.id,
                contact.first_name,
                contact.last_name,
                contact.email,
                contact.phone,
                contact.title,
                contact.company.name,
                contact.owner.get_username() if contact.owner else "",
                contact.created_at.isoformat(),
            ]
        )


@login_required
def export_contacts(request):
    response = StreamingHttpResponse(export_rows(), content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="contacts.csv"'
    return response

"""Seed deterministic, realistic-looking data: 20 users, 2,000 companies, 20,000 contacts, 100,000 activities.

Idempotent: does nothing when contacts already exist. Contact and company ids are explicit
(1..20000 and 1..2000) so load scripts can pick them without discovery.
"""

import random
import re
import time
from datetime import datetime, timedelta, timezone

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.core.management.color import no_style
from django.db import connection, transaction

from contacts.models import Activity, Company, Contact

USERS = 20
COMPANIES = 2000
CONTACTS = 20000
ACTIVITIES = 100000
PASSWORD = "bench-pass"

# A fixed "now" so two seeds produce the same rows.
ANCHOR = datetime(2026, 10, 1, 12, 0, tzinfo=timezone.utc)

FIRST_NAMES = """Adam Alice Amelia Andre Anna Arthur Beatrice Benjamin Bruno Camille Carlos Charlotte Chloe Clara
Daniel David Diana Edward Elena Elias Emma Eric Eva Felix Fiona Gabriel George Grace Hannah Hugo Ian Irene Isabel
Jack Jacob James Jasmine Jean Jonas Julia Julian Karen Kevin Laura Leo Liam Lily Louis Lucas Lucy Marc Maria Martin
Mason Maya Michael Mila Nadia Nathan Nicole Noah Olivia Oscar Paul Peter Priya Rachel Rafael Rebecca Robert Rosa
Ruby Samuel Sara Simon Sophie Stella Thomas Tina Victor Violet William Yara Zoe""".split()

LAST_NAMES = """Adams Allen Anderson Baker Barnes Bell Bennett Brooks Brown Butler Campbell Carter Clark Collins Cooper
Cox Davies Davis Dixon Edwards Ellis Evans Fisher Foster Fox Gray Green Griffin Hall Harris Hayes Henderson Hill
Howard Hughes Hunt Jackson James Jenkins Johnson Jones Kelly Kennedy King Knight Lee Lewis Marshall Martin Mason
Miller Mitchell Moore Morgan Morris Murphy Nelson Owen Palmer Parker Patel Perry Phillips Powell Price Reed
Richards Roberts Robinson Rogers Russell Scott Shaw Simmons Smith Stevens Stewart Taylor Thomas Thompson Turner
Walker Ward Watson White Williams Wilson Wood Wright Young""".split()

COMPANY_PREFIXES = """Alder Apex Arbor Atlas Aurora Beacon Birch Blue Bright Cedar Clear Cobalt Copper Crest Delta
Eagle Ember Evergreen Falcon Fern First Granite Harbor Helix Horizon Indigo Iron Juniper Keystone Lake Lantern
Lumen Maple Meridian Mesa Nimbus North Northern Oak Onyx Orbit Pacific Peak Pine Pioneer Quartz Radiant Raven
Red Ridge River Sage Silver Slate Solar Summit Sun Terra Timber Tidal Union Vale Vertex Willow Zenith""".split()

COMPANY_STEMS = """Analytics Bridge Cloud Craft Dynamics Energy Forge Freight Foods Health Industries Labs Logistics
Materials Media Networks Optics Partners Robotics Systems Software Solutions Studios Supply Tech Textiles
Therapeutics Works""".split()

COMPANY_FORMS = ["Group", "Inc", "Ltd", "LLC", "Co", "Holdings", "International", "Partners"]

INDUSTRIES = [
    "Software", "Financial services", "Healthcare", "Manufacturing", "Retail", "Logistics", "Energy",
    "Education", "Media", "Telecommunications", "Construction", "Hospitality", "Agriculture", "Consulting",
]

CITIES = """Amsterdam Atlanta Austin Barcelona Berlin Boston Brussels Chicago Copenhagen Dallas Denver Dublin
Edinburgh Frankfurt Geneva Helsinki Lisbon London Lyon Madrid Manchester Milan Montreal Munich Nantes Oslo Paris
Philadelphia Portland Prague Rotterdam Seattle Stockholm Toronto Turin Vancouver Vienna Warsaw Zurich""".split()

SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"]
SIZE_WEIGHTS = [30, 35, 20, 10, 5]

TITLES = [
    "Chief Executive Officer", "Chief Technology Officer", "Chief Financial Officer", "VP of Sales",
    "VP of Engineering", "Head of Operations", "Head of Procurement", "Head of Marketing", "Sales Manager",
    "Account Executive", "Account Manager", "Operations Manager", "Product Manager", "Project Manager",
    "Engineering Manager", "Software Engineer", "Data Analyst", "Office Manager", "Purchasing Agent",
    "Customer Success Manager", "Finance Director", "HR Manager", "Marketing Specialist", "Founder",
    "Managing Director", "Business Analyst", "IT Manager", "Legal Counsel", "Team Lead", "Consultant",
]

PHONE_FORMATS = [
    lambda rng: f"+1 {rng.randint(200, 989)}-{rng.randint(200, 999)}-{rng.randint(0, 9999):04d}",
    lambda rng: f"+44 20 {rng.randint(1000, 9999)} {rng.randint(1000, 9999)}",
    lambda rng: f"+33 1 {rng.randint(10, 99)} {rng.randint(10, 99)} {rng.randint(10, 99)} {rng.randint(10, 99)}",
    lambda rng: f"+49 30 {rng.randint(100000, 999999)}",
]

KIND_NAMES = ["call", "email", "meeting", "note"]
KIND_WEIGHTS = [25, 40, 15, 20]

TOPICS = [
    "pricing", "the renewal", "onboarding", "contract terms", "the integration roadmap", "the pilot project",
    "the security review", "invoice questions", "the quarterly review", "training sessions", "the proposal",
    "a support escalation", "licence counts", "the rollout plan", "data migration", "the budget cycle",
    "partnership options", "the new office", "delivery timelines", "the service agreement",
]

DOCUMENTS = ["the proposal", "the pricing sheet", "the contract draft", "the product overview", "the case study",
             "the onboarding checklist", "the security questionnaire", "the meeting notes", "the revised quote"]

SUBJECTS = {
    "call": ["Intro call about {topic}", "Follow-up call on {topic}", "Discovery call", "Quick check-in call",
             "Call to discuss {topic}", "Voicemail left about {topic}"],
    "email": ["Sent {document}", "Re: {topic}", "Question about {topic}", "Follow-up on {topic}",
              "Shared {document}", "Thanks for your time"],
    "meeting": ["Meeting: {topic}", "Product demo", "Quarterly business review", "On-site visit",
                "Workshop on {topic}", "Kick-off meeting"],
    "note": ["Note on {topic}", "Decision maker changed", "Budget confirmed", "Competitor mentioned",
             "Internal note: {topic}", "Next steps agreed"],
}

SENTENCES = [
    "Spoke about {topic} and they want to see numbers before the end of the month.",
    "Sent over {document}; waiting for feedback from their team.",
    "They asked for a discount on a two-year commitment.",
    "The main concern is how long the migration would take.",
    "Agreed to schedule a follow-up next week with their technical lead.",
    "Their budget for this quarter is already allocated, so we aim for the next one.",
    "Very positive conversation, they compared us with two other vendors.",
    "Needs approval from finance before signing anything.",
    "Asked whether we support single sign-on and audit logs.",
    "Mentioned that the project owner changed teams last month.",
    "Reviewed {topic} together and noted three open questions.",
    "They would like a short demo for the rest of the team.",
    "No answer so far, trying again on Thursday.",
    "Confirmed the contact person for invoices and renewals.",
    "Interested in a pilot with a small group of users first.",
    "Raised an issue about response times; promised an answer within two days.",
    "Shared {document} and walked through the main sections.",
    "They are expanding to a second site and will need more seats.",
    "Decision expected after their board meeting.",
    "Left a note for the account manager to prepare a tailored offer.",
]


def pick_weighted(rng, items, weights):
    return rng.choices(items, weights=weights)[0]


def slug(text):
    return re.sub(r"[^a-z0-9]+", "", text.lower())


class Command(BaseCommand):
    help = "Seed deterministic demo data (idempotent: does nothing when contacts exist)."

    def handle(self, *args, **options):
        if Contact.objects.exists():
            self.stdout.write("Contacts already exist, nothing to seed.")
            return

        started = time.monotonic()
        rng = random.Random(42)
        with transaction.atomic():
            users = self.create_users(rng)
            self.create_companies(rng)
            created_at = self.create_contacts(rng, users)
            self.create_activities(rng, users, created_at)
            self.reset_sequences()
        with connection.cursor() as cursor:
            cursor.execute("ANALYZE")
        self.stdout.write(self.style.SUCCESS(f"Seeded in {time.monotonic() - started:.1f}s."))

    def create_users(self, rng):
        user_model = get_user_model()
        names = [f"user{n:02d}" for n in range(1, USERS + 1)]
        existing = set(user_model.objects.filter(username__in=names).values_list("username", flat=True))
        password_hash = make_password(PASSWORD)
        new_users = []
        for name in names:
            if name in existing:
                continue
            new_users.append(
                user_model(
                    username=name,
                    first_name=rng.choice(FIRST_NAMES),
                    last_name=rng.choice(LAST_NAMES),
                    email=f"{name}@crm.example",
                    password=password_hash,
                    # The first user can sign in to /admin/.
                    is_staff=name == "user01",
                    is_superuser=name == "user01",
                )
            )
        user_model.objects.bulk_create(new_users)
        users = list(user_model.objects.filter(username__in=names).order_by("username"))
        self.stdout.write(f"Users: {len(users)}")
        return users

    def create_companies(self, rng):
        seen = set()
        companies = []
        for company_id in range(1, COMPANIES + 1):
            while True:
                name = f"{rng.choice(COMPANY_PREFIXES)} {rng.choice(COMPANY_STEMS)} {rng.choice(COMPANY_FORMS)}"
                if name not in seen:
                    seen.add(name)
                    break
            companies.append(
                Company(
                    id=company_id,
                    name=name,
                    industry=rng.choice(INDUSTRIES),
                    city=rng.choice(CITIES),
                    size=pick_weighted(rng, SIZES, SIZE_WEIGHTS),
                )
            )
        Company.objects.bulk_create(companies, batch_size=1000)
        self.company_names = {company.id: company.name for company in companies}
        self.stdout.write(f"Companies: {len(companies)}")

    def create_contacts(self, rng, users):
        seen_emails = set()
        contacts = []
        created_at = {}
        for contact_id in range(1, CONTACTS + 1):
            first, last = rng.choice(FIRST_NAMES), rng.choice(LAST_NAMES)
            company_id = rng.randint(1, COMPANIES)
            domain = slug(self.company_names[company_id]) + ".example"
            email = f"{first}.{last}@{domain}".lower()
            if email in seen_emails:
                email = f"{first}.{last}{contact_id}@{domain}".lower()
            seen_emails.add(email)
            created = ANCHOR - timedelta(days=rng.randint(30, 900), minutes=rng.randint(0, 1439))
            created_at[contact_id] = created
            contacts.append(
                Contact(
                    id=contact_id,
                    first_name=first,
                    last_name=last,
                    email=email,
                    phone=rng.choice(PHONE_FORMATS)(rng),
                    title=rng.choice(TITLES),
                    company_id=company_id,
                    owner=rng.choice(users),
                    created_at=created,
                )
            )
        Contact.objects.bulk_create(contacts, batch_size=2000)
        self.stdout.write(f"Contacts: {len(contacts)}")
        return created_at

    def create_activities(self, rng, users, created_at):
        batch = []
        total = 0
        for _ in range(ACTIVITIES):
            contact_id = rng.randint(1, CONTACTS)
            kind = pick_weighted(rng, KIND_NAMES, KIND_WEIGHTS)
            topic, document = rng.choice(TOPICS), rng.choice(DOCUMENTS)
            subject = rng.choice(SUBJECTS[kind]).format(topic=topic, document=document)
            sentences = rng.sample(SENTENCES, rng.randint(1, 4))
            body = " ".join(sentence.format(topic=topic, document=document) for sentence in sentences)
            span = int((ANCHOR - created_at[contact_id]).total_seconds())
            happened_at = created_at[contact_id] + timedelta(seconds=rng.randint(0, span))
            batch.append(
                Activity(
                    contact_id=contact_id,
                    kind=kind,
                    subject=subject,
                    body=body,
                    happened_at=happened_at,
                    user=rng.choice(users),
                )
            )
            if len(batch) == 5000:
                Activity.objects.bulk_create(batch)
                total += len(batch)
                batch = []
        if batch:
            Activity.objects.bulk_create(batch)
            total += len(batch)
        self.stdout.write(f"Activities: {total}")

    def reset_sequences(self):
        # Companies and contacts were inserted with explicit ids; move their sequences past them.
        with connection.cursor() as cursor:
            for sql in connection.ops.sequence_reset_sql(no_style(), [Company, Contact]):
                cursor.execute(sql)

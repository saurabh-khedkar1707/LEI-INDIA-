import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Company Policies",
  description: "View LEI Indias company policies and download official policy documents.",
}

type PolicyDocument = {
  title: string
  description: string
  href: string
}

const policyDocuments: PolicyDocument[] = [
  {
    title: "Corporate Social Responsibility Policy",
    description: "Our commitment to responsible, ethical, and sustainable business practices.",
    href: "/documents/POLICY-HR-001 Corporate Social Responsibility Policy.pdf",
  },
  {
    title: "Corporate Social Responsibility Policy (Copy)",
    description: "Secondary copy of our CSR policy for reference.",
    href: "/documents/POLICY-HR-001 Corporate Social Responsibility Policy - Copy.pdf",
  },
  {
    title: "Anti-Bribery or Corruption Policy",
    description: "Guidelines and expectations for preventing bribery and corruption.",
    href: "/documents/POLICY-HR-002 Anti-Bribery or Corruption Policy.pdf",
  },
  {
    title: "Code of Conduct Policy",
    description: "Standards of professional and ethical behavior for all stakeholders.",
    href: "/documents/POLICY-HR-003 Code of Conduct Policy.pdf",
  },
  {
    title: "Whistle Blower Policy",
    description: "Framework to safely report unethical or illegal activities.",
    href: "/documents/POLICY-HR-004 Whistle Blower Policy.pdf",
  },
  {
    title: "Prevention of Sexual Harassment (POSH) Policy",
    description: "Measures and procedures to prevent and address sexual harassment at the workplace.",
    href: "/documents/POLICY-HR-005 Prevention of Sexual Harassment Policy (1).pdf",
  },
  {
    title: "Terms and Conditions – Sales",
    description: "Standard terms and conditions governing our sales and commercial transactions.",
    href: "/documents/Terms and Conditions_Sales (1).pdf",
  },
]

export default function CompanyPoliciesPage() {
  return (
    <>
      <Header />
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Company Policies
            </h1>
            <p className="text-gray-600 mb-10 max-w-2xl">
              Access and review our official company policies. Click on any policy card to open the
              corresponding PDF document in a new tab.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {policyDocuments.map((policy) => (
                <a
                  key={policy.href}
                  href={policy.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg md:text-xl">{policy.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{policy.description}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}


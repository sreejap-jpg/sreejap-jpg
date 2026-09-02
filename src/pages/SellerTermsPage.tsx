import { Link } from 'react-router-dom';

export function SellerTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-navy-500 sm:text-5xl">
          Seller &amp; Publisher Terms &amp; Conditions
        </h1>
        <p className="mt-4 font-serif text-lg italic text-gold-500">
          Effective Date: [Insert Date] · Last Updated: [Insert Date]
        </p>
      </div>

      <div className="mt-10 space-y-6 font-serif text-base leading-relaxed text-ink-600">
        <p>
          These Seller &amp; Publisher Terms &amp; Conditions (&ldquo;Seller Terms&rdquo;) govern the listing
          and sale of books by authors, publishers, and booksellers through the Kathazo platform
          (kathazo.com), operated by Kathazo.
        </p>
        <p>
          By creating a seller account, listing a book, or clicking &ldquo;I Agree&rdquo; during onboarding,
          you accept these Seller Terms in full. If you do not agree, please do not list books on Kathazo.
          These Seller Terms are in addition to, and should be read together with, Kathazo&rsquo;s general{' '}
          <Link to="/terms-and-conditions" className="text-navy-500 underline hover:text-navy-700">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link to="/privacy-policy" className="text-navy-500 underline hover:text-navy-700">
            Privacy Policy
          </Link>
          .
        </p>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">1. What Kathazo Is</h2>
        <p>
          Kathazo is an online marketplace that connects readers with books offered for sale by independent
          authors, publishers, and booksellers. <strong>Kathazo is a facilitation platform only.</strong> We do
          not acquire, edit, produce, or take ownership of any book you list. You remain the seller of record
          for every book you list.
        </p>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">2. Non-Exclusive Listing</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Listing your books on Kathazo does <strong>not</strong> restrict you from selling the same titles
            through any other channel — Amazon, your own website, other marketplaces, or physical retail — at
            the same time.
          </li>
          <li>
            Kathazo does not require exclusivity, and you are free to end your listing on Kathazo at any time.
          </li>
          <li>
            Kathazo does not guarantee any minimum number of sales, views, or level of visibility for your
            books.
          </li>
        </ul>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">3. Fees &amp; Payment</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Launch offer:</strong> As of the Effective Date above, Kathazo charges{' '}
            <strong>no listing fee and no commission</strong> to Sellers. You receive the full price you set
            for your book on every sale.
          </li>
          <li>
            <strong>How the price works:</strong> Kathazo may display your book to buyers at a price slightly
            higher than the amount you set, to cover Kathazo&rsquo;s own platform costs. This difference is paid
            by the buyer, not deducted from your price. You will always receive the exact amount you set as
            your payout.
          </li>
          <li>
            <strong>Payment method:</strong> All payments are processed via Razorpay, using Razorpay Route to
            automatically send your payout directly to your linked account at the time of each sale. You are
            responsible for providing accurate and complete bank/payment account details for this purpose.
          </li>
          <li>
            <strong>This fee structure may change in the future.</strong> If Kathazo introduces a seller-side
            listing fee or commission at any point, we will notify all active Sellers in advance (via email
            and/or an in-app notice) before any such change takes effect, and you will have the opportunity to
            review the new terms and choose whether to continue selling on Kathazo under them.
          </li>
        </ul>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">4. Your Responsibilities as a Seller</h2>
        <p>By listing a book on Kathazo, you confirm and agree that:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            You own, or hold all necessary rights and licenses to sell and distribute, every book you list.
          </li>
          <li>
            None of your listed content infringes any third party&rsquo;s copyright, trademark, or other
            intellectual property rights.
          </li>
          <li>
            Your content is not bound by any exclusivity arrangement (such as enrollment in Amazon KDP Select)
            that would legally prevent you from selling it on Kathazo. It is your responsibility to check this
            before listing.
          </li>
          <li>
            All information you provide about each book — title, author, description, price, cover image — is
            accurate and not misleading.
          </li>
          <li>
            You will respond in good faith to any buyer questions or disputes relating to your listed books.
          </li>
        </ul>
        <p>
          You agree to indemnify and hold Kathazo harmless from any claims, damages, or losses arising from a
          breach of the above.
        </p>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">5. Content &amp; Listing Standards</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Kathazo reserves the right to remove any listing that violates these Seller Terms, Kathazo&rsquo;s
            general Terms &amp; Conditions, or applicable law, with notice to you where practicable.
          </li>
          <li>
            We may request additional information or verification before approving a listing or an account.
          </li>
          <li>
            You are responsible for keeping your listings (pricing, availability, descriptions) accurate and
            up to date.
          </li>
        </ul>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">6. Refunds &amp; Cancellations</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Refund requests from buyers are handled according to Kathazo&rsquo;s published Refund Policy, as
            may be updated from time to time.
          </li>
          <li>
            Where a valid refund is issued for a completed sale, the corresponding payout to you for that sale
            will be reversed.
          </li>
          <li>
            You agree to cooperate in good faith to help resolve buyer disputes relating to your books.
          </li>
        </ul>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">7. Account Suspension &amp; Termination</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>You may stop selling on Kathazo and close your seller account at any time.</li>
          <li>
            Kathazo may suspend or terminate a seller account for violation of these Seller Terms, fraudulent
            activity, repeated buyer complaints, or any conduct harmful to the platform or its users.
          </li>
          <li>
            Any payouts owed for completed sales prior to suspension or termination will still be settled.
          </li>
        </ul>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">8. Relationship of the Parties</h2>
        <p>
          Nothing in these Seller Terms creates a partnership, joint venture, employment, or agency
          relationship between you and Kathazo beyond this limited marketplace-facilitation arrangement. You
          remain an independent seller responsible for your own tax, legal, and regulatory obligations,
          including any applicable GST or income tax on your earnings.
        </p>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Kathazo&rsquo;s total liability to you arising out of or
          relating to these Seller Terms shall not exceed the total fees actually paid by you to Kathazo in
          the three (3) months preceding the claim (which, under the current no-fee launch offer, may be
          zero). Kathazo shall not be liable for indirect, incidental, or consequential damages of any kind.
        </p>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">10. Changes to These Seller Terms</h2>
        <p>
          We may update these Seller Terms from time to time, including changes to the fee structure described
          in Section 3. Material changes will be communicated to active Sellers in advance. Continued listing
          or selling on Kathazo after such changes take effect constitutes acceptance of the updated Seller
          Terms.
        </p>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">11. Governing Law</h2>
        <p>
          These Seller Terms are governed by the laws of India. Any disputes arising from these Seller Terms
          shall first be attempted to be resolved amicably. Failing resolution, disputes shall be subject to
          the exclusive jurisdiction of the courts of [Insert your city, e.g. Anand, Gujarat].
        </p>

        <hr className="border-cream-300" />

        <h2 className="font-serif text-2xl font-bold text-navy-500">12. Contact Us</h2>
        <p>Questions about these Seller Terms can be directed to:</p>
        <p>
          <strong>Email:</strong> contact@kathazo.com (or support@kathazo.com)
        </p>

        <hr className="border-cream-300" />

        <p className="font-serif text-sm italic text-ink-400">
          By clicking &ldquo;I Agree&rdquo; or creating a seller account, you confirm that you have read,
          understood, and agree to be bound by these Seller &amp; Publisher Terms &amp; Conditions.
        </p>
        <p className="font-serif text-xs italic text-ink-300">
          This document is a template and general guidance only. It does not constitute legal advice. Please
          have it reviewed by a qualified lawyer familiar with Indian contract and e-commerce law before
          publishing it live, particularly given that it governs real payments and legal responsibility
          between Kathazo and third-party sellers.
        </p>
      </div>
    </div>
  );
}

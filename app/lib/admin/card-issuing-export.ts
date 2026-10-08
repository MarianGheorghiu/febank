import type {
    CardCustomer,
    IssuedCard,
} from "@/app/lib/types/admin/card-issuing";

export function cardRegistryCsv(
    cards: IssuedCard[],
    customers: CardCustomer[],
): string {
    const cell = (value: string | number) => {
        let text = String(value);
        if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
    };
    const rows = cards.map((card) => {
        const customer = customers.find(
            (customer) => customer.id === card.userId,
        );
        return [
            card.id,
            card.userId,
            customer?.name ?? "",
            customer?.email ?? "",
            `**** ${card.last4}`,
            card.type,
            card.network,
            card.currency,
            card.status,
            card.limits.daily,
            card.limits.monthly,
            card.limits.atmDaily,
            card.delivery,
            card.createdAt,
            card.updatedAt,
        ];
    });
    return (
        "\uFEFF" +
        [
            [
                "Card ID",
                "Customer ID",
                "Customer name",
                "Customer email",
                "Masked card",
                "Type",
                "Network",
                "Currency",
                "Status",
                "Daily limit",
                "Monthly limit",
                "Daily ATM limit",
                "Fulfilment",
                "Created at (UTC)",
                "Updated at (UTC)",
            ],
            ...rows,
        ]
            .map((row) => row.map(cell).join(","))
            .join("\r\n")
    );
}

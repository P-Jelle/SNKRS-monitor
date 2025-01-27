const proxyUrl = "https://sneakermonitor.nl/backend/proxy.php?";
// const proxyUrl = "http://localhost/GitHub/sNKRS-monitor/backend/proxy.php?";
const apiFilter = "anchor=0&count=50&filter=marketplace(NL)&filter=language(nl)&filter=upcoming(true)&filter=channelId(010794e5-35fe-4e32-aaff-cd2c74f89d61)&filter=exclusiveAccess(true,false)&sort=effectiveStartSellDateAsc";

const stockIndicator = {
    OOS: "❌",
    LOW: "🟠",
    MEDIUM: "🟡",
    HIGH: "🟢",
};

const launchConverter = {
    DAN: "Raffle",
    LEO: "Queue",
    FLOW: "Drop",
};

fetch(proxyUrl + apiFilter, {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})
    .then((response) => response.json())
    .then((data) => {
        const products = data.objects || [];

        if (products.length === 0) {
            console.error("No sneakers found in the response!");
            return;
        }

        const productList = document.querySelector(".product-list");

        products.forEach((product) => {
            const releaseDetails = (product.productInfo || []).filter((releaseDetail) => releaseDetail.launchView && releaseDetail.merchProduct?.productType === "FOOTWEAR");

            releaseDetails.forEach((releaseDetail) => {
                const title = releaseDetail.productContent?.title || "";
                const color = product.publishedContent?.properties?.coverCard?.properties?.title || "";
                const exclusiveAccess = releaseDetail.merchProduct?.exclusiveAccess ? "Yes" : "No";
                const launchType = launchConverter[releaseDetail.launchView?.method] || "";
                const image = product.publishedContent?.nodes?.[0]?.nodes?.[0]?.properties?.squarish?.url || "";
                const date = releaseDetail.launchView?.startEntryDate || "";
                const parsedDate = date ? new Date(date) : null;
                const launchDate = parsedDate ? parsedDate.toLocaleDateString() : "";
                const launchTime = parsedDate ? parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
                const price = releaseDetail.merchPrice?.fullPrice || "";

                const slug = product.publishedContent?.properties?.seo?.slug || "";
                const productUrl = `https://www.nike.com/${product.marketplace?.toLowerCase()}/launch/t/${slug}`;

                let stockInfo = "";
                if (releaseDetail.skus && releaseDetail.availableGtins) {
                    stockInfo = releaseDetail.skus
                        .map((skuDetail) => {
                            const availableGtin = releaseDetail.availableGtins.find((g) => g.gtin === skuDetail.gtin);
                            const stockLevel = availableGtin?.level || "";
                            const size = skuDetail.countrySpecifications?.[0]?.localizedSize || "";
                            const stockEmoji = stockIndicator[stockLevel.toUpperCase()] || "";
                            return `
                                <div class="stock-item">
                                    <span class="stock-emoji">${stockEmoji}</span>
                                    ${size} - ${stockLevel}
                                </div>
                            `;
                        })
                        .join("");
                }

                const productDiv = document.createElement("div");
                productDiv.classList.add("product");
                productDiv.innerHTML = `
                    <a href="${productUrl}" target="_blank">
                        <h2>${title}</h2>
                        <h2>${color}</h2>
                        <img src="${image}" alt="${title}" />
                        <p><strong>Exclusive Access:</strong> ${exclusiveAccess}</p>
                        <p><strong>Launch Type:</strong> ${launchType}</p>
                        <p><strong>Launch Date:</strong> ${launchDate}</p>
                        <p><strong>Launch Time:</strong> ${launchTime}</p>
                        <p><strong>Price:</strong> €${price}</p>
                        <div class="stock-info">${stockInfo}</div>
                    </a>`;
                productList.appendChild(productDiv);
            });
        });
    })
    .catch((error) => {
        console.error("Error fetching data:", error);
    });

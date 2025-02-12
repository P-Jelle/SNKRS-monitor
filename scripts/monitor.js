const proxyUrl = "https://sneakermonitor.nl/backend/proxy.php?";
// const proxyUrl = "http://localhost/GitHub/SNKRS-monitor/backend/proxy.php?";
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
            const productIds = product.publishedContent?.properties?.products?.map((p) => p.productId) || [];

            const releaseDetails = (product.productInfo || [])
                .filter((releaseDetail) => releaseDetail.launchView && releaseDetail.merchProduct?.productType === "FOOTWEAR")
                .sort((a, b) => {
                    const indexA = productIds.indexOf(a.merchProduct.id);
                    const indexB = productIds.indexOf(b.merchProduct.id);
                    return indexA - indexB;
                });

            releaseDetails.forEach((releaseDetail) => {
                const title = product.publishedContent?.properties?.title || "";
                const color = product.publishedContent?.properties?.coverCard?.properties?.title || "";
                const exclusiveAccess = releaseDetail.merchProduct?.exclusiveAccess ? "Yes" : "No";
                const launchType = launchConverter[releaseDetail.launchView?.method] || "";
                const date = releaseDetail.launchView?.startEntryDate || "";
                const parsedDate = date ? new Date(date) : null;
                const launchDate = parsedDate ? parsedDate.toLocaleDateString() : "";
                const launchTime = parsedDate ? parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
                const price = releaseDetail.merchPrice?.fullPrice || "";

                const slug = product.publishedContent?.properties?.seo?.slug || "";
                const productUrl = `https://www.nike.com/${product.marketplace?.toLowerCase()}/launch/t/${slug}`;

                const image = product.publishedContent?.nodes?.[0]?.nodes?.[0]?.properties?.squarish?.url || "";
                let finalImage = image;

                const nodes = product.publishedContent?.nodes || [];

                // Should be a better way to detect kids/baby shoes
                const skuSizes = releaseDetail.skus?.map((sku) => sku.countrySpecifications?.[0]?.localizedSize) || [];
                const isKids = skuSizes.some((size) => size && ["32"].includes(size));
                const isBaby = skuSizes.some((size) => size && ["22"].includes(size));

                for (const node of nodes) {
                    const subtitle = node?.properties?.subtitle?.toLowerCase() || "";
                    const imageUrl = node?.properties?.squarish?.url;

                    if (!imageUrl) continue;

                    if (subtitle.includes("peuter") && isBaby) {
                        finalImage = imageUrl;
                        detectedCategory = "Baby/Peuter";
                        break;
                    } else if ((subtitle.includes("kleuter") || subtitle.includes("kids")) && isKids) {
                        finalImage = imageUrl;
                        detectedCategory = "Kids/Kleuter";
                        break;
                    }
                }

                const updateImage = finalImage.replace("t_prod_ss", "w_1280,q_auto,f_auto");

                let stockInfo = "";
                if (releaseDetail.skus && releaseDetail.availableGtins) {
                    stockInfo = releaseDetail.skus.reverse()
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
                        <img src="${updateImage}" alt="${title}" />
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

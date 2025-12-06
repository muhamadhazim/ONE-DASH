package scraper

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestScrapeTokopedia(t *testing.T) {
	// Mock Tokopedia HTML response with OG tags and JSON-LD
	mockHTML := `
		<!DOCTYPE html>
		<html>
		<head>
			<meta property="og:title" content="Jual Apple iPhone 14 Pro Max 128GB - Deep Purple | Tokopedia" />
			<meta property="og:image" content="https://images.tokopedia.net/img/cache/500-square/VqbcmM/2022/10/10/product-image.jpg" />
			<meta property="og:description" content="Jual Apple iPhone 14 Pro Max 128GB dengan harga Rp20.999.000 dari toko online iBox, Jakarta Pusat. Cari produk HP & Smartphone lainnya di Tokopedia. Jual beli online aman dan nyaman hanya di Tokopedia." />
			<meta property="og:url" content="https://www.tokopedia.com/ibox/apple-iphone-14-pro-max-128gb-deep-purple" />
			<meta property="og:price:amount" content="20999000" />
			<meta property="og:price:currency" content="IDR" />
			<script type="application/ld+json">
			{
				"@context": "https://schema.org/",
				"@type": "Product",
				"name": "Apple iPhone 14 Pro Max 128GB - Deep Purple",
				"image": "https://images.tokopedia.net/img/cache/500-square/VqbcmM/2022/10/10/product-image.jpg",
				"description": "Apple iPhone 14 Pro Max 128GB",
				"brand": {
					"@type": "Brand",
					"name": "Apple"
				},
				"offers": {
					"@type": "Offer",
					"url": "https://www.tokopedia.com/ibox/apple-iphone-14-pro-max-128gb-deep-purple",
					"priceCurrency": "IDR",
					"price": "20999000",
					"availability": "https://schema.org/InStock"
				},
				"aggregateRating": {
					"@type": "AggregateRating",
					"ratingValue": "4.9",
					"ratingCount": "1500",
					"reviewCount": "500"
				}
			}
			</script>
		</head>
		<body>
			<div data-testid="lblPDPDetailProductSoldCounter">Terjual 1 rb+</div>
		</body>
		</html>
	`

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify User-Agent
		assert.Equal(t, "facebookexternalhit/1.1;line-poker/1.0", r.Header.Get("User-Agent"))
		w.Write([]byte(mockHTML))
	}))
	defer server.Close()

	service := NewService(nil)
	service.client.Transport = &mockTransport{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			assert.Equal(t, "facebookexternalhit/1.1;line-poker/1.0", req.Header.Get("User-Agent"))
			return &http.Response{
				StatusCode: 200,
				Body:       http.NoBody,
			}, nil
		},
	}
}

type mockTransport struct {
	RoundTripFunc func(req *http.Request) (*http.Response, error)
}

func (m *mockTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	return m.RoundTripFunc(req)
}

func TestScrapeTokopedia_WithMockTransport(t *testing.T) {
	mockHTML := `
		<!DOCTYPE html>
		<html>
		<head>
			<meta property="og:title" content="Jual Apple iPhone 14 Pro Max 128GB - Deep Purple | Tokopedia" />
			<meta property="og:price:amount" content="20999000" />
			<script type="application/ld+json">
			{
				"@context": "https://schema.org/",
				"@type": "Product",
				"name": "Apple iPhone 14 Pro Max 128GB - Deep Purple",
				"offers": { "@type": "Offer", "price": "20999000" },
				"aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9" }
			}
			</script>
		</head>
		<body>
			<div data-testid="lblPDPDetailProductSoldCounter">Terjual 1 rb+</div>
		</body>
		</html>
	`

	service := NewService(nil)
	service.client.Transport = &mockTransport{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			recorder := httptest.NewRecorder()
			recorder.WriteString(mockHTML)
			return recorder.Result(), nil
		},
	}

	meta, err := service.ScrapeProduct("https://www.tokopedia.com/test")
	assert.NoError(t, err)
	assert.Equal(t, 4.9, meta.Rating)
}

func TestExtractLazadaModuleData(t *testing.T) {
	// Read the local file for testing
	content, err := os.ReadFile("d:/RPL2/ONE-DASH/backend/lazada.html")
	if err != nil {
		t.Skipf("lazada.html not found: %v", err)
	}

	html := string(content)

	// Regex to find: app.run(__moduleData__, ...
	re := regexp.MustCompile(`(?s)__moduleData__\s*=\s*(\{.*?\});`)
	matches := re.FindStringSubmatch(html)

	if len(matches) >= 2 {
		jsonStr := matches[1]
		fmt.Printf("DEBUG: Found JSON length: %d\n", len(jsonStr))

		var data map[string]interface{}
		if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
			fmt.Printf("DEBUG: JSON Unmarshal error: %v\n", err)
			fmt.Printf("DEBUG: Snippet: %s\n", jsonStr[:min(len(jsonStr), 200)])
		} else {
			fmt.Println("DEBUG: Successfully unmarshaled JSON!")

			// Traverse to find review/rating
			if d, ok := data["data"].(map[string]interface{}); ok {
				if root, ok := d["root"].(map[string]interface{}); ok {
					if fields, ok := root["fields"].(map[string]interface{}); ok {
						if review, ok := fields["review"].(map[string]interface{}); ok {
							fmt.Printf("DEBUG: Found review: %+v\n", review)
						} else if rating, ok := fields["rating"].(map[string]interface{}); ok {
							fmt.Printf("DEBUG: Found rating: %+v\n", rating)
						} else {
							fmt.Println("DEBUG: fields.review/rating not found, dumping keys:")
							for k := range fields {
								fmt.Println(k)
							}
						}
					} else {
						fmt.Println("DEBUG: root.fields not found")
					}
				} else {
					fmt.Println("DEBUG: data.root not found")
				}
			} else {
				fmt.Println("DEBUG: data.data not found")
			}
		}
	} else {
		fmt.Println("DEBUG: __moduleData__ regex not matched")
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

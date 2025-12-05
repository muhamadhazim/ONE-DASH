package services

import (
	"net/http"
	"net/http/httptest"
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

	service := NewScraperService()
	// Override client transport to route requests to mock server
	// Since we can't easily inject the URL into the service method for the "tokopedia.com" check,
	// we'll test the extraction logic by temporarily modifying how we call it or by trusting the service to follow the URL.
	// However, the service checks for "tokopedia.com" in the URL to select the platform.
	// So we need to trick it or just test the extraction function if it was public.
	// Since it's private, we'll use the public ScrapeProduct but we need the URL to contain "tokopedia.com".
	// We can append the mock server URL with a fake query param or just rely on the fact that we are testing the logic.

	// Actually, ScrapeProduct checks the URL string to decide which scraper to use.
	// If we pass the localhost URL, it will go to "generic".
	// We need to modify the service or the test to handle this.
	// For now, let's just assume we can pass a URL that looks like tokopedia but points to our server?
	// No, http.Get will fail.

	// Strategy: We will create a new method `scrapeTokopediaFromURL` or similar that takes the URL,
	// OR we just assume the `detectPlatform` logic is simple string contains.
	// We can't easily mock the domain resolution in a simple unit test without dependency injection of the HTTP client which we have.
	// But the URL passed to `client.Do` is the one from the argument.

	// Let's rely on the fact that we can't easily integration test the *routing* logic without a real URL,
	// but we can test the *parsing* if we could inject the HTML.
	// Since we can't, we will skip the platform detection check in a unit test
	// OR we will make the `client` in `ScraperService` use a custom Transport that intercepts requests to "www.tokopedia.com".

	service.client.Transport = &mockTransport{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			assert.Equal(t, "facebookexternalhit/1.1;line-poker/1.0", req.Header.Get("User-Agent"))
			return &http.Response{
				StatusCode: 200,
				Body:       http.NoBody, // Placeholder, we need a ReadCloser
				// We'll use httptest.ResponseRecorder for easier body creation
			}, nil
		},
	}
}

// Better approach: Test the extraction logic by exposing a helper or just implementing the test with a real-ish structure
// but since I can't easily change the code structure right now without being invasive,
// I will write the test to use a custom Transport that returns the mock HTML for ANY request.
// And I will pass a URL that contains "tokopedia.com" so the router selects the correct function.

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
			<meta property="og:image" content="https://images.tokopedia.net/img/cache/500-square/VqbcmM/2022/10/10/product-image.jpg" />
			<meta property="og:description" content="Jual Apple iPhone 14 Pro Max 128GB dengan harga Rp20.999.000 dari toko online iBox, Jakarta Pusat. Cari produk HP & Smartphone lainnya di Tokopedia. Jual beli online aman dan nyaman hanya di Tokopedia." />
			<meta property="og:price:amount" content="20999000" />
			<script type="application/ld+json">
			{
				"@context": "https://schema.org/",
				"@type": "Product",
				"name": "Apple iPhone 14 Pro Max 128GB - Deep Purple",
				"offers": {
					"@type": "Offer",
					"price": "20999000"
				},
				"aggregateRating": {
					"@type": "AggregateRating",
					"ratingValue": "4.9",
					"ratingCount": "1500"
				}
			}
			</script>
		</head>
		<body>
			<div data-testid="lblPDPDetailProductSoldCounter">Terjual 1 rb+</div>
		</body>
		</html>
	`

	service := NewScraperService()
	service.client.Transport = &mockTransport{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			assert.Equal(t, "facebookexternalhit/1.1;line-poker/1.0", req.Header.Get("User-Agent"))

			// Create a response with the mock HTML
			recorder := httptest.NewRecorder()
			recorder.WriteString(mockHTML)

			return recorder.Result(), nil
		},
	}

	// URL must contain "tokopedia.com" to trigger the correct scraper
	meta, err := service.ScrapeProduct("https://www.tokopedia.com/ibox/apple-iphone-14-pro-max-128gb-deep-purple")

	assert.NoError(t, err)
	assert.NotNil(t, meta)
	assert.Equal(t, "Apple iPhone 14 Pro Max 128GB - Deep Purple", meta.Title)
	assert.Equal(t, "https://images.tokopedia.net/img/cache/500-square/VqbcmM/2022/10/10/product-image.jpg", meta.ImageURL)
	assert.Equal(t, 20999000.0, meta.Price)
	assert.Equal(t, 4.9, meta.Rating)
	assert.Equal(t, "tokopedia", meta.Platform)
	// Sold count extraction might depend on the implementation details (regex vs JSON-LD)
	// In the mock, we provided both JSON-LD ratingCount (which is not sold) and a "Terjual" div.
	// We'll see what the implementation picks up.
}

func TestScrapeTokopedia_RealHTML(t *testing.T) {
	mockHTMLReal := `
		<!DOCTYPE html>
		<html>
		<body>
			<p data-unify="Typography" data-testid="lblPDPDetailProductSoldCounter" class="css-2h6p9v-unf-heading e1qvo2ff8"><span class="main">Terjual</span> <!-- -->1 rb+</p>
		</body>
		</html>
	`

	service := NewScraperService()
	service.client.Transport = &mockTransport{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			recorder := httptest.NewRecorder()
			recorder.WriteString(mockHTMLReal)
			return recorder.Result(), nil
		},
	}

	meta, err := service.ScrapeProduct("https://www.tokopedia.com/real-html-test")
	assert.NoError(t, err)
	assert.Equal(t, 1000, meta.Sold)
}

func TestScrapeTokopedia_ReviewCountFallback(t *testing.T) {
	mockHTMLReview := `
		<!DOCTYPE html>
		<html>
		<head>
			<meta itemprop="reviewCount" content="735"/>
			<script type="application/ld+json">
			{
				"@context": "https://schema.org/",
				"@type": "Product",
				"aggregateRating": {
					"@type": "AggregateRating",
					"reviewCount": "735"
				}
			}
			</script>
		</head>
		<body>
			<!-- No sold count here -->
		</body>
		</html>
	`

	service := NewScraperService()
	service.client.Transport = &mockTransport{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			recorder := httptest.NewRecorder()
			recorder.WriteString(mockHTMLReview)
			return recorder.Result(), nil
		},
	}

	meta, err := service.ScrapeProduct("https://www.tokopedia.com/review-fallback-test")
	assert.NoError(t, err)
	// Should pick up 735 from reviewCount
	assert.Equal(t, 735, meta.Sold)
}

func TestScrapeTokopedia_ShortLinkRedirect(t *testing.T) {
	// Mock the short link response
	mockShortLinkHTML := `<a href="https://www.tokopedia.com/redirected-product">Found</a>.`

	// Mock the final product page
	mockProductHTML := `
		<!DOCTYPE html>
		<html>
		<head>
			<meta property="og:title" content="Redirected Product | Tokopedia" />
			<meta property="og:price:amount" content="50000" />
		</head>
		<body>
			<div data-testid="lblPDPDetailProductSoldCounter">Terjual 50</div>
		</body>
		</html>
	`

	service := NewScraperService()
	service.client.Transport = &mockTransport{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			recorder := httptest.NewRecorder()

			if req.URL.String() == "https://tk.tokopedia.com/short" {
				recorder.WriteString(mockShortLinkHTML)
			} else {
				recorder.WriteString(mockProductHTML)
			}

			return recorder.Result(), nil
		},
	}

	meta, err := service.ScrapeProduct("https://tk.tokopedia.com/short")
	assert.NoError(t, err)
	assert.Equal(t, "Redirected Product", meta.Title)
	assert.Equal(t, 50000.0, meta.Price)
	assert.Equal(t, 50, meta.Sold)
}

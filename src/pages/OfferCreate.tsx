import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { createOffer, getOfferById, getProductsList, getRestaurantsList, updateOffer, type CreateOfferPayload, type OfferGroup, type Product, type Restaurant } from "../utils/api"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { Alert, AlertDescription } from "../components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function OfferCreate () {
  const { id } = useParams<{ id?: string }>()
  const editing = !!id;
  const navigate = useNavigate()

  const [createError, setCreateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<Boolean>(true)
  const [form, setForm] = useState<{
    name: string;
    description: string;
    price: number;
    restaurantId: string;
    menuId: string;
    isActive: boolean;
    groups: OfferGroup[];
  }>({
    name: '',
    description: '',
    price: 0,
    restaurantId: '',
    menuId: '',
    isActive: true,
    groups: []
  });

  const addProductToGroup = (groupIndex: number, productId: number | string | undefined) => {
    if (productId === undefined || productId === null) return
    const productIdNum = Number(productId)
    if (isNaN(productIdNum)) return
    setForm(prev => ({
      ...prev,
      groups: prev.groups.map((g, i) =>
        i === groupIndex
          ? { ...g, productsIds: [...g.productsIds, productIdNum] }
          : g
      )
    }));
  };

  const removeProductFromGroup = (groupIndex: number, productId: number | string | undefined) => {
    if (productId === undefined || productId === null) return
    const productIdNum = Number(productId)
    if (isNaN(productIdNum)) return
    setForm(prev => ({
      ...prev,
      groups: prev.groups.map((g, i) =>
        i === groupIndex
          ? { ...g, productsIds: g.productsIds.filter(id => id !== productIdNum) }
          : g
      )
    }));
  };


  useEffect(() => {
    let mounted = true
    
    Promise.all([
      getRestaurantsList('deletedBy=null').catch(() => []),
      getProductsList().catch(() => []),
      id ? getOfferById(id).catch(() => null) : Promise.resolve(null)
    ]).then(([rs, pr, offer]) => {
      if (!mounted) return
      setRestaurants(rs || [])
      setProducts(pr || [])
      if (offer) {
        setForm({
          name: offer.name || '',
          description: offer.description || '',
          price: Number(offer.price),
          restaurantId: String(offer.restaurantId) || '',
          menuId: String(offer.menuId) || '',
          isActive: Boolean(offer.isActive),
          groups: offer.groups.map(g => ({
            name: g.name,
            minItems: g.minItems,
            maxItems: g.maxItems,
            productsIds: g.offerGroupProducts?.map(p => Number(p.product?.id || p.productId || p.id)).filter((id): id is number => !isNaN(id)) || []
          }))

        });

      }

    }).catch((e) => { if (mounted) setCreateError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) } )
    return () => { mounted = false }
  }, [id])

  useEffect(() => {
    setSelectedRestaurant(null);
    const selectedRestaurant = restaurants.find(r => String(r.id) === form.restaurantId);  // Use find() for efficiency
    if (selectedRestaurant?.menu) {
      setSelectedRestaurant(selectedRestaurant)
      console.log(selectedRestaurant)
    }
  }, [form.restaurantId]);  // Add restaurants as dependency

  const addGroup = () => {
    setForm(prev => ({
      ...prev,
      groups: [
        ...prev.groups,
        {
          name: '',
          description: '',
          minItems: 0,
          maxItems: 0,
          productsIds: []
        }
      ]
    }));
  };

  const removeGroup = (index: number) => {
    setForm(prev => ({
      ...prev,
      groups: prev.groups.filter((_, i) => i !==index)
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setSaving(true)

    try {
      const payload: CreateOfferPayload = {
        name: String(form.name).trim(),
        description: String(form.description).trim(),
        price: Number(form.price),
        restaurantId: Number(form.restaurantId),
        menuId: Number(form.menuId),
        isActive: form.isActive,
        groups: form.groups
      }
      if (editing && id) {
        await updateOffer(Number(id), payload)
      }
      else {
        await createOffer(payload)
      }
      navigate('/offers')

    } 
    catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err))
    }
    finally {
      setSaving(false)
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          {editing ? 'Edit Offer' : 'Create Offer'}
        </h1>
      </div>
      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">Loading...</CardContent>
        </Card>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 max-w-5xl lg:grid-cols-2"
        >
          {/* Basic info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {editing ? 'Update Offer' : 'New Offer'}
              </CardTitle>
              <CardDescription>Fill in the offer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Offer Name *</Label>
                <Input
                  id="name"
                  className="mt-1.5 w-full"
                  value={
                    form.name !== undefined && form.name !== null
                      ? String(form.name)
                      : ''
                  }
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="Offer name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  className="mt-1.5 w-full"
                  value={form.description}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Offer description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    className="mt-1.5 w-full"
                    value={form.price}
                    step={0.01}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        price: Number(e.target.value),
                      }))
                    }
                    placeholder="Offer price"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="restaurant">Restaurant *</Label>
                  <Select
                    id="restaurant"
                    className="mt-1.5 w-full"
                    value={String(form.restaurantId ?? '')}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        restaurantId: String(e.target.value),
                      }))
                    }
                    required
                  >
                    <option value="">Select a restaurant</option>
                    {restaurants.map((r) => (
                      <option key={String(r.id)} value={String(r.id)}>
                        {r.name ?? String(r.id)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="menu">Menu *</Label>
                  <Select
                    id="menu"
                    className="mt-1.5 w-full"
                    value={String(form.menuId ?? '')}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        menuId: String(e.target.value),
                      }))
                    }
                    required
                    disabled={!form.restaurantId}
                  >
                    <option value="">Select a menu</option>
                    {selectedRestaurant?.menu &&
                      (Array.isArray(selectedRestaurant.menu) ? (
                        selectedRestaurant.menu.map((m) => (
                          <option key={String(m.id)} value={String(m.id)}>
                            {m.name ?? String(m.id)}
                          </option>
                        ))
                      ) : (
                        <option
                          key={String((selectedRestaurant.menu as any).id)}
                          value={String((selectedRestaurant.menu as any).id)}
                        >
                          {(selectedRestaurant.menu as any).name ??
                            String((selectedRestaurant.menu as any).id)}
                        </option>
                      ))}
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Checkbox
                  id="available"
                  checked={!!form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((s) => ({ ...s, isActive: checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="available"
                  className="mb-0 cursor-pointer text-sm"
                >
                  Active offer
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Groups & products */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Offer groups</CardTitle>
              <CardDescription>
                Configure groups and assign products to each group
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}

              <Button type="button" variant="default" size="sm" onClick={addGroup}>
                Add Group
              </Button>

              <div className="space-y-4">
                {form.groups.map((g, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">
                          Group {index + 1}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400 text-xs font-semibold"
                          onClick={() => removeGroup(index)}
                        >
                          Remove Group
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`groupName-${index}`}>Group Name</Label>
                          <Input
                            id={`groupName-${index}`}
                            className="mt-1"
                            value={g.name}
                            onChange={(e) => {
                              const value = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                groups: prev.groups.map((group, i) =>
                                  i === index ? { ...group, name: value } : group,
                                ),
                              }))
                            }}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`minItems-${index}`}>Minimum Items</Label>
                          <Input
                            id={`minItems-${index}`}
                            className="mt-1"
                            type="number"
                            value={g.minItems}
                            onChange={(e) => {
                              const value = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                groups: prev.groups.map((group, i) =>
                                  i === index
                                    ? { ...group, minItems: Number(value) }
                                    : group,
                                ),
                              }))
                            }}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`maxItems-${index}`}>Maximum Items</Label>
                          <Input
                            id={`maxItems-${index}`}
                            className="mt-1"
                            type="number"
                            value={g.maxItems}
                            onChange={(e) => {
                              const value = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                groups: prev.groups.map((group, i) =>
                                  i === index
                                    ? { ...group, maxItems: Number(value) }
                                    : group,
                                ),
                              }))
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Products</Label>
                        <div className="flex gap-4 mt-2">
                          {/* Available */}
                          <div className="flex-1">
                            <div className="font-semibold mb-1 text-sm">
                              Available
                            </div>
                            <div className="border rounded p-2 h-48 overflow-y-auto bg-white dark:bg-slate-900">
                              {products.filter(
                                (p) => !g.productsIds.includes(Number(p.id)),
                              ).length === 0 && (
                                <div className="text-xs text-gray-400">
                                  No more products
                                </div>
                              )}

                              {products
                                .filter(
                                  (p) => !g.productsIds.includes(Number(p.id)),
                                )
                                .map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded group"
                                  >
                                    <span>{p.name ?? p.id}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600 text-xs font-bold"
                                      onClick={() => addProductToGroup(index, p.id)}
                                    >
                                      Add
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Selected */}
                          <div className="flex-1">
                            <div className="font-semibold mb-1 text-sm">
                              Selected
                            </div>
                            <div className="border rounded p-2 h-48 overflow-y-auto bg-white dark:bg-slate-900">
                              {g.productsIds.length === 0 && (
                                <div className="text-xs text-gray-400">
                                  No products selected
                                </div>
                              )}

                              {products
                                .filter((p) =>
                                  g.productsIds.includes(Number(p.id)),
                                )
                                .map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded group"
                                  >
                                    <span>{p.name ?? p.id}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 text-xs font-bold"
                                      onClick={() =>
                                        removeProductFromGroup(index, p.id)
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          Click &quot;Add&quot; to select, &quot;Remove&quot; to
                          unselect.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Link to="/offers">
                  <Button variant="default" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? id
                      ? 'Saving...'
                      : 'Creating...'
                    : id
                    ? 'Update'
                    : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}
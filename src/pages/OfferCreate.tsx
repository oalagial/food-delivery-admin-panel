import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { createOffer, getOfferById, getProductsList, getRestaurantsList, updateOffer, type CreateOfferPayload, type OfferGroup, type Product, type Restaurant } from "../utils/api"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"

export default function OfferCreate () {
  const { id } = useParams<{ id?: string }>()
  const editing = !!id;
  const navigate = useNavigate()

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<boolean>(false)
  const [saving, setSaving] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
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

  const addProductToGroup = (groupIndex: number, productId: number) => {
    setForm(prev => ({
      ...prev,
      groups: prev.groups.map((g, i) =>
        i === groupIndex
          ? { ...g, productsIds: [...g.productsIds, productId] }
          : g
      )
      }));
    };

  const removeProductFromGroup = (groupIndex: number, productId: number) => {
    setForm(prev => ({
      ...prev,
      groups: prev.groups.map((g, i) =>
        i === groupIndex
          ? { ...g, productsIds: g.productsIds.filter(id => id !== productId) }
          : g
      )
    }));
  };


  useEffect(() => {
    let mounted = true
    
    Promise.all([
      getRestaurantsList().catch(() => []),
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
            productsIds: g.products?.map(p => p.id)
          }))

        });

      }

    }).catch((e) => { if (mounted) setCreateError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) } )
    return () => { mounted = false }
  }, [id])

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
        menuId: 1,
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
        <h1 className="text-3xl font-bold">{editing ? "Edit Offer" : "Create Offer"}</h1>
      </div>
      {loading ? (
          <Card className="shadow-md">
            <CardContent className="pt-6">Loading...</CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle> {editing ? "Update Offer" : "New Offer"} </CardTitle>
              <CardDescription>Fill in the offer information below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Offer Name *</Label>
                    <Input
                      id="name"
                      className="mt-2 w-full"
                      value={form.name !== undefined && form.name !== null ? String(form.name) : ''}
                      onChange={e => {
                        setForm(s => ({...s, name: e.target.value}))
                      }}
                      placeholder="Offer name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      className="mt-2 w-full"
                      value={form.description}
                      onChange={(e) => setForm(s => ({...s, description: e.target.value}))}
                      placeholder="Offer description"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price" >Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      className="mt-2 w-full"
                      value={form.price}
                      step={0.01}
                      onChange={(e) => setForm(s => ({...s, price: Number(e.target.value) }))}
                      placeholder="Offer price"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="restaurant">Restaurant *</Label>
                    <Select
                      id="restaurant"
                      className="mt-2 w-full"
                      value={String(form.restaurantId ?? '')}
                      onChange={(e) => setForm(s => ({...s, restaurantId: String(e.target.value) }))}
                      required
                    >
                      <option value="">Select a restaurant</option>
                      {restaurants.map(r => <option key={String(r.id)} value={String(r.id)}>{r.name ?? String(r.id)}</option>)}

                    </Select>
                  </div>

                   <div className="flex items-end gap-3">
                    <Label htmlFor="available" className="mb-0 cursor-pointer">Active</Label>
                    <input 
                      id="available"
                      type="checkbox" 
                      checked={!!form.isActive} 
                      onChange={(e)=> setForm(s=>({...s, isActive: e.target.checked}))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>
                
                <div>
                  <Button type="button" onClick={addGroup}>
                    Add Group
                  </Button>

                </div>

                {form.groups.map((g, index) => (
                  <div className="bg-gray-300 rounded-lg">
                    <div key={index} className="m-3 p-3">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="default"
                          className="text-red-600 text-xs font-bold mb-4"
                          onClick={() => removeGroup(index)}
                        >
                          Remove Group
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`groupName-${index}`}>Group Name</Label>
                          <Input
                            id={`groupName-${index}`}
                            value={g.name}
                            onChange={e => {
                              const value = e.target.value;
                              setForm(prev => ({
                                ...prev,
                                groups: prev.groups.map((group, i) =>
                                  i === index ? { ...group, name: value } : group
                                )
                              }));
                            }}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`minItems-${index}`}>Minimum Items</Label>
                          <Input
                            id={`minItems-${index}`}
                            value={g.minItems}
                            onChange={e => {
                              const value = e.target.value;
                              setForm(prev => ({
                                ...prev,
                                groups: prev.groups.map((group, i) =>
                                  i === index ? { ...group, minItems: Number(value) } : group
                                )
                              }));
                            }}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`maxItems-${index}`}>Maximum Items</Label>
                          <Input
                            id={`maxItems-${index}`}
                            value={g.maxItems}
                            onChange={e => {
                              const value = e.target.value;
                              setForm(prev => ({
                                ...prev,
                                groups: prev.groups.map((group, i) =>
                                  i === index ? { ...group, maxItems: Number(value) } : group
                                )
                              }));
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
                            <div className="font-semibold mb-1 text-sm">Available</div>
                            <div className="border rounded p-2 h-48 overflow-y-auto bg-white">
                              {products.filter(p => !g.productsIds.includes(p.id)).length === 0 && (
                                <div className="text-xs text-gray-400">No more products</div>
                              )}

                              {products
                                .filter(p => !g.productsIds.includes(p.id))
                                .map(p => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded group"
                                  >
                                    <span>{p.name ?? p.id}</span>
                                    <button
                                      type="button"
                                      className="text-green-600 text-xs font-bold"
                                      onClick={() => addProductToGroup(index, p.id)}
                                    >
                                      Add
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Selected */}
                          <div className="flex-1">
                            <div className="font-semibold mb-1 text-sm">Selected</div>
                            <div className="border rounded p-2 h-48 overflow-y-auto bg-white">
                              {g.productsIds.length === 0 && (
                                <div className="text-xs text-gray-400">No products selected</div>
                              )}

                              {products
                                .filter(p => g.productsIds.includes(p.id))
                                .map(p => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded group"
                                  >
                                    <span>{p.name ?? p.id}</span>
                                    <button
                                      type="button"
                                      className="text-red-600 text-xs font-bold"
                                      onClick={() => removeProductFromGroup(index, p.id)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          Click "Add" to select, "Remove" to unselect.
                        </p>


                      </div>
                    </div>

                  </div>
                ))}


                <div className="col-start-2 flex justify-end gap-3 pt-4">
                  <Link to="/offers">
                    <Button variant="default" type="submit">Cancel</Button>
                  </Link>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? (id ? 'Saving...' : 'Creating...') : (id ? 'Update' : 'Create')}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        )
      }
    </div>
  )
}
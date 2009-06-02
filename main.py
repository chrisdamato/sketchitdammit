import wsgiref.handlers
import os, string, random, time

from google.appengine.ext        import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext        import db

class MainHandler(webapp.RequestHandler):
	def get(self, url):		
		if url != '':
			img = self.get_image(url)
			template_values = {}
			if img != None: #invalid or expired url
				template_values = {'paths'  : img.paths,
									'width' : img.width,
									'height': img.height}

			template_values['url'] = url
			path = os.path.join(os.path.dirname(__file__), 'index.html')
			self.response.out.write(template.render(path,
				template_values))
		else:
			self.go_random();

	def go_random(self):
		rand  = [random.choice(string.letters + string.digits) for i in range(10)]
		rand += [string.letters[int(i)] for i in str(time.time()).split('.')[0]]
		random.shuffle(rand)
		url   = ''.join(rand)
		self.redirect('/' + url)	

	def get_image(self, url):
		return Image.all().filter('url =', url).get()
		
class SaveHandler(webapp.RequestHandler):
	def post(self):
		u = self.request.get('url')
		p = self.request.get('paths')
		w = self.request.get('width')
		h = self.request.get('height')
		img = Image.all().filter('url =', u).get()
		if img and img.key():
			img.url = u
			img.paths = p
			img.width = w
			img.height = h
		else:
			img = Image(url=u, paths=p, width=w, height=h)

		img.put();

class Image(db.Model):
	url       = db.StringProperty(required=True)
	paths     = db.TextProperty(required=True)
	timestamp = db.DateTimeProperty(required=True, auto_now_add=True)
	width     = db.StringProperty(required=True)
	height    = db.StringProperty(required=True)

def main():
	application = webapp.WSGIApplication([('/save', SaveHandler),
										('/(.*)', MainHandler)],
										 debug=True)
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()
